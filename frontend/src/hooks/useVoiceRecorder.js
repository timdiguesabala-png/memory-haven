import { useRef, useState, useCallback } from 'react'

export function useVoiceRecorder() {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const secondsRef = useRef(0)

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Microphone non disponible sur cet appareil')
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    streamRef.current = stream
    const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm'
    const mr = new MediaRecorder(stream, { mimeType: mime })
    chunksRef.current = []
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    mr.start(200)
    mediaRecorderRef.current = mr
    setRecording(true)
    setSeconds(0)
    secondsRef.current = 0
    timerRef.current = setInterval(() => {
      secondsRef.current += 1
      setSeconds(secondsRef.current)
    }, 1000)
  }, [])

  const stop = useCallback(() => {
    return new Promise((resolve, reject) => {
      const mr = mediaRecorderRef.current
      if (!mr || mr.state === 'inactive') {
        stopTimer()
        setRecording(false)
        return resolve(null)
      }
      mr.onstop = () => {
        stopTimer()
        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        setRecording(false)
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' })
        if (blob.size < 100) {
          return resolve(null)
        }
        const file = new File([blob], `vocal_${Date.now()}.webm`, { type: blob.type })
        resolve({ file, duration: secondsRef.current })
      }
      mr.onerror = () => reject(new Error('Enregistrement vocal échoué'))
      mr.stop()
    })
  }, [])

  const cancel = useCallback(() => {
    const mr = mediaRecorderRef.current
    if (mr && mr.state !== 'inactive') mr.stop()
    stopTimer()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    chunksRef.current = []
    setRecording(false)
    setSeconds(0)
  }, [])

  return { recording, seconds, start, stop, cancel }
}
