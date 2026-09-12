import { useCallback, useEffect, useRef, useState } from 'react'
import type { ClosetItem, DetectedPiece, Screen } from '../types'
import { hexForColorName } from '../lib/color'
import { composeName, guessAttributes } from '../lib/guess'
import { BANDS, captureFrame, segment, type FrameSource } from '../lib/segment'
import { findMatch, newId } from '../lib/closet'
import TopBar from '../components/TopBar'
import PieceCard from '../components/PieceCard'

interface Props {
  items: ClosetItem[]
  onCommit: (added: ClosetItem[], wornItemIds: string[]) => void
  onNavigate: (screen: Screen) => void
}

type Stage = 'idle' | 'starting' | 'live' | 'review' | 'saved'

interface Receipt {
  added: number
  worn: string[]
}

/**
 * Screen 2. Real getUserMedia capture, then a simulated three-band segmentation whose
 * bands are drawn on the live view so the split is visible before the shutter fires.
 * Nothing saves until the user has looked at every guess.
 */
export default function Capture({ items, onCommit, onNavigate }: Props) {
  const [stage, setStage] = useState<Stage>('idle')
  const [error, setError] = useState<string | null>(null)
  const [frame, setFrame] = useState<string | null>(null)
  const [pieces, setPieces] = useState<DetectedPiece[]>([])
  const [receipt, setReceipt] = useState<Receipt | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  // Release the camera on unmount — leaving the indicator light on is alarming.
  useEffect(() => stopCamera, [stopCamera])

  const startCamera = useCallback(async () => {
    setError(null)
    setStage('starting')
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('This browser does not expose a camera to web pages.')
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      })
      streamRef.current = stream
      setStage('live')
      // The <video> only exists once the live stage renders, so attach on the next frame.
      requestAnimationFrame(() => {
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        void video.play()
      })
    } catch (cause) {
      stopCamera()
      setStage('idle')
      setError(
        cause instanceof DOMException && cause.name === 'NotAllowedError'
          ? 'Camera permission was declined. Allow it in your browser, or use a photo from disk instead.'
          : cause instanceof Error
            ? `${cause.message} You can load a photo from disk instead.`
            : 'The camera could not be started. You can load a photo from disk instead.',
      )
    }
  }, [stopCamera])

  /** Shared tail of both capture paths: cut bands, guess attributes, look for duplicates. */
  const runPipeline = useCallback(
    (source: FrameSource) => {
      const canvas = captureFrame(source)
      setFrame(canvas.toDataURL('image/jpeg', 0.85))

      const crops = segment(canvas)
      if (crops.length === 0) {
        setError('Nothing distinguishable in the frame. Try more light, or step back for a fuller shot.')
        return
      }

      setError(null)
      setPieces(
        crops.map((crop) => {
          const guess = guessAttributes(crop.region, crop.colorHex)
          const match = findMatch({ category: guess.category, colorHex: crop.colorHex }, items)
          return {
            id: `piece-${crop.region}-${Date.now()}`,
            image: crop.image,
            colorHex: crop.colorHex,
            guessed: { type: true, color: true, material: true, size: true },
            name: composeName(guess.color, guess.material, guess.type),
            nameEdited: false,
            brand: '',
            purchaseDate: '',
            category: guess.category,
            type: guess.type,
            color: guess.color,
            material: guess.material,
            size: guess.size,
            price: 0,
            match,
            matchDecision: null,
            dismissed: false,
          }
        }),
      )
      setStage('review')
    },
    [items],
  )

  const shoot = useCallback(() => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    runPipeline({
      element: video,
      width: video.videoWidth,
      height: video.videoHeight,
      mirror: true,
    })
    stopCamera()
  }, [runPipeline, stopCamera])

  const loadFromDisk = useCallback(
    (file: File) => {
      const url = URL.createObjectURL(file)
      const image = new Image()
      image.onload = () => {
        runPipeline({ element: image, width: image.naturalWidth, height: image.naturalHeight, mirror: false })
        URL.revokeObjectURL(url)
      }
      image.onerror = () => {
        setError('That file could not be read as an image.')
        URL.revokeObjectURL(url)
      }
      image.src = url
      stopCamera()
    },
    [runPipeline, stopCamera],
  )

  const patchPiece = useCallback((id: string, patch: Partial<DetectedPiece>) => {
    setPieces((current) =>
      current.map((piece) => {
        if (piece.id !== id) return piece
        const next = { ...piece, ...patch }

        // A colour override replaces the measured hex, so duplicate detection keeps
        // comparing like with like.
        if (patch.color && patch.color !== piece.color) {
          next.colorHex = hexForColorName(patch.color)
        }
        if (!next.nameEdited) {
          next.name = composeName(next.color, next.material, next.type)
        }

        // Category or colour changed means the previous match may no longer hold.
        if (patch.category || patch.color) {
          next.match = findMatch({ category: next.category, colorHex: next.colorHex }, items)
          next.matchDecision = null
        }
        return next
      }),
    )
  }, [items])

  const decideMatch = useCallback((id: string, samePiece: boolean) => {
    setPieces((current) =>
      current.map((piece) => (piece.id === id ? { ...piece, matchDecision: samePiece } : piece)),
    )
  }, [])

  const toggleDismiss = useCallback((id: string) => {
    setPieces((current) =>
      current.map((piece) => (piece.id === id ? { ...piece, dismissed: !piece.dismissed } : piece)),
    )
  }, [])

  const save = useCallback(() => {
    const keep = pieces.filter((piece) => !piece.dismissed)
    const worn: string[] = []
    const added: ClosetItem[] = []

    for (const piece of keep) {
      if (piece.matchDecision === true && piece.match) {
        worn.push(piece.match.itemId)
        continue
      }
      added.push({
        id: newId(),
        name: piece.name.trim() || composeName(piece.color, piece.material, piece.type),
        brand: piece.brand.trim(),
        purchaseDate: piece.purchaseDate,
        category: piece.category,
        type: piece.type,
        color: piece.color,
        colorHex: piece.colorHex,
        material: piece.material,
        size: piece.size,
        price: piece.price,
        numWear: 1,
        image: piece.image,
        addedAt: Date.now(),
      })
    }

    onCommit(added, worn)
    setReceipt({
      added: added.length,
      worn: worn.map((id) => items.find((item) => item.id === id)?.name ?? 'an existing piece'),
    })
    setStage('saved')
  }, [items, onCommit, pieces])

  const retake = useCallback(() => {
    setPieces([])
    setFrame(null)
    setReceipt(null)
    setError(null)
    setStage('idle')
  }, [])

  const keepCount = pieces.filter((piece) => !piece.dismissed).length
  const undecided = pieces.filter((piece) => !piece.dismissed && piece.match && piece.matchDecision === null)

  return (
    <>
      <TopBar title="Capture & Log" onHome={() => onNavigate('landing')} />

      <main className="page">
        {stage !== 'saved' && (
          <div className="capture__lead">
            <p className="eyebrow">Step {stage === 'review' ? '2 of 2' : '1 of 2'}</p>
            <h1>{stage === 'review' ? 'Check what it found' : 'Photograph the outfit'}</h1>
            <p>
              {stage === 'review'
                ? 'Colour is measured off your photo. Type, material and size are suggestions — correct anything that is wrong, then save.'
                : 'Frame a full-length shot or lay the outfit out flat. The three dashed bands are the pieces the app will cut out: top, bottom, shoes.'}
            </p>
          </div>
        )}

        {error && (
          <p className="alert alert--error" role="status">
            {error}
          </p>
        )}

        {(stage === 'idle' || stage === 'starting' || stage === 'live') && (
          <div className="stage">
            <div className="viewfinder">
              {stage === 'live' ? (
                <>
                  <video ref={videoRef} playsInline muted />
                  <Guides />
                </>
              ) : (
                <div className="viewfinder__idle">
                  <strong>{stage === 'starting' ? 'Starting camera…' : 'Camera off'}</strong>
                  <p>
                    Your browser will ask permission. The video never leaves this page — the frame is
                    cut up and measured locally.
                  </p>
                </div>
              )}
            </div>

            <div className="capture__controls">
              {stage === 'live' ? (
                <button className="btn btn--lg btn--primary" onClick={shoot}>
                  Capture outfit
                </button>
              ) : (
                <button
                  className="btn btn--lg btn--primary"
                  onClick={startCamera}
                  disabled={stage === 'starting'}
                >
                  Start camera
                </button>
              )}
              <button className="btn" onClick={() => fileRef.current?.click()}>
                Use a photo from disk
              </button>
              <input
                ref={fileRef}
                className="visually-hidden"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) loadFromDisk(file)
                  event.target.value = ''
                }}
              />
            </div>
            <p className="capture__note">
              Camera access needs HTTPS or localhost. The photo option is here for laptops whose
              webcam cannot see past the desk.
            </p>
          </div>
        )}

        {stage === 'review' && (
          <div className="stage">
            {frame && (
              <div className="viewfinder">
                <img src={frame} alt="The outfit you captured" />
                <Guides />
              </div>
            )}

            <p className="eyebrow">{pieces.length} pieces detected</p>

            <div className="pieces">
              {pieces.map((piece) => (
                <PieceCard
                  key={piece.id}
                  piece={piece}
                  onChange={(patch) => patchPiece(piece.id, patch)}
                  onDecideMatch={(samePiece) => decideMatch(piece.id, samePiece)}
                  onToggleDismiss={() => toggleDismiss(piece.id)}
                />
              ))}
            </div>

            <div className="saveline">
              <button
                className="btn btn--lg btn--primary"
                onClick={save}
                disabled={keepCount === 0 || undecided.length > 0}
              >
                Save to closet
              </button>
              <button className="btn" onClick={retake}>
                Retake
              </button>
              <span className="saveline__count">
                {undecided.length > 0
                  ? `Answer the ${undecided.length === 1 ? 'match question' : `${undecided.length} match questions`} first.`
                  : `${keepCount} ${keepCount === 1 ? 'piece' : 'pieces'} ready.`}
              </span>
            </div>
          </div>
        )}

        {stage === 'saved' && receipt && (
          <div className="card receipt">
            <p className="eyebrow">Logged</p>
            <h2>Your closet is up to date.</h2>
            <ul>
              {receipt.added > 0 && (
                <li>
                  {receipt.added} new {receipt.added === 1 ? 'piece' : 'pieces'} added, each starting
                  at one wear.
                </li>
              )}
              {receipt.worn.map((name, index) => (
                <li key={`${name}-${index}`}>A wear logged on {name}, lowering its cost per wear.</li>
              ))}
            </ul>
            <div className="receipt__actions">
              <button className="btn btn--lg btn--primary" onClick={() => onNavigate('closet')}>
                View My Closet
              </button>
              <button className="btn" onClick={retake}>
                Log another outfit
              </button>
              <button className="btn btn--ghost" onClick={() => onNavigate('landing')}>
                Back to home
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  )
}

/** The dashed bands, positioned from the same numbers segment() cuts on. */
function Guides() {
  return (
    <div className="guides" aria-hidden="true">
      {BANDS.map((band) => (
        <div
          key={band.region}
          className="guides__band"
          style={{
            top: `${band.top * 100}%`,
            bottom: `${(1 - band.bottom) * 100}%`,
            left: `${band.left * 100}%`,
            right: `${(1 - band.right) * 100}%`,
          }}
        >
          <span className="guides__label">{band.label}</span>
        </div>
      ))}
    </div>
  )
}
