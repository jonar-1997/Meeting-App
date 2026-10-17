import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Meeting } from '../types';
import { RAW_TEMPLATES } from '../services/storage';
import { 
  Sparkles, 
  Mic, 
  MicOff, 
  FileText, 
  Users, 
  RotateCcw, 
  Radio,
  AlertCircle
} from 'lucide-react';

interface NotesInputProps {
  initialTitle: string;
  initialNotes: string;
  initialDate: string;
  initialType: Meeting['meetingType'];
  initialAttendees: string[];
  userName: string;
  userRole?: string;
  isProcessing: boolean;
  autoStartDictation?: boolean;
  onDictationStarted?: () => void;
  onAnalyze: (payload: {
    rawNotes: string;
    title: string;
    date: string;
    meetingType: Meeting['meetingType'];
    attendees: string[];
  }) => void;
}

export const NotesInput: React.FC<NotesInputProps> = ({
  initialTitle,
  initialNotes,
  initialDate,
  initialType,
  initialAttendees,
  userName,
  isProcessing,
  autoStartDictation,
  onDictationStarted,
  onAnalyze,
}) => {
  const [title, setTitle] = useState(initialTitle || 'Product & Sprint Alignment');
  const [notes, setNotes] = useState(initialNotes || '');
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [meetingType, setMeetingType] = useState<Meeting['meetingType']>(initialType || 'sprint');
  const [attendeeInput, setAttendeeInput] = useState(initialAttendees.join(', '));
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribingChunk, setIsTranscribingChunk] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [liveInterimText, setLiveInterimText] = useState('');
  const [micError, setMicError] = useState<string | null>(null);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);
  const usingFallbackRecorderRef = useRef(false);
  const isTranscribeInFlightRef = useRef(false);
  const backoffUntilRef = useRef(0);

  // Refs for real-time scratchpad composition
  const baseNotesRef = useRef(initialNotes || '');
  const accumulatedFinalRef = useRef('');
  const sessionFinalRef = useRef('');
  const sessionInterimRef = useRef('');

  // Refs for fallback getUserMedia, AudioContext level meter, and MediaRecorder
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const activeRecorderRef = useRef<MediaRecorder | null>(null);
  const chunkTimerRef = useRef<number | null>(null);
  const hadVoiceActivityRef = useRef(false);

  const initialAttendeesStr = initialAttendees.join(', ');

  useEffect(() => {
    if (!isRecordingRef.current) {
      setTitle(initialTitle || 'Product & Sprint Alignment');
      setNotes(initialNotes || '');
      baseNotesRef.current = initialNotes || '';
      setDate(initialDate || new Date().toISOString().split('T')[0]);
      setMeetingType(initialType || 'sprint');
      setAttendeeInput(initialAttendeesStr);
    }
  }, [initialTitle, initialNotes, initialDate, initialType, initialAttendeesStr]);

  const syncScratchpadNotes = useCallback(() => {
    const base = baseNotesRef.current.trim();
    const spokenParts = [
      accumulatedFinalRef.current.trim(),
      sessionFinalRef.current.trim(),
      sessionInterimRef.current.trim(),
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    if (!spokenParts) {
      setNotes(base);
      return;
    }

    const prefix = base ? `${base}\n- ` : '- ';
    const combined = `${prefix}${spokenParts}`;
    setNotes(combined);

    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, []);

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const transcribeAudioBlob = useCallback(
    async (blob: Blob, mimeType: string) => {
      if (blob.size < 1200) return;
      if (isTranscribeInFlightRef.current) return;
      if (Date.now() < backoffUntilRef.current) return;

      try {
        isTranscribeInFlightRef.current = true;
        setIsTranscribingChunk(true);
        const audioBase64 = await blobToBase64(blob);
        const res = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioBase64, mimeType }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.rateLimited) {
          backoffUntilRef.current = Date.now() + (data.retryAfterMs || 15000);
          return;
        }
        const text = (data.transcript || '').trim();
        if (text) {
          accumulatedFinalRef.current = [accumulatedFinalRef.current, text]
            .filter(Boolean)
            .join(' ');
          syncScratchpadNotes();
        }
      } catch {
        // Ignore transient network hiccups during fallback chunking
      } finally {
        isTranscribeInFlightRef.current = false;
        setIsTranscribingChunk(false);
      }
    },
    [syncScratchpadNotes]
  );

  const stopAllRecording = useCallback(() => {
    isRecordingRef.current = false;
    usingFallbackRecorderRef.current = false;
    setIsRecording(false);
    setAudioLevel(0);
    setLiveInterimText('');

    // Finalize any pending interim or session text into the scratchpad
    const remainingSpoken = [
      accumulatedFinalRef.current.trim(),
      sessionFinalRef.current.trim(),
      sessionInterimRef.current.trim(),
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    if (remainingSpoken) {
      const base = baseNotesRef.current.trim();
      const updated = base ? `${base}\n- ${remainingSpoken}` : `- ${remainingSpoken}`;
      baseNotesRef.current = updated;
      setNotes(updated);
    }

    accumulatedFinalRef.current = '';
    sessionFinalRef.current = '';
    sessionInterimRef.current = '';

    if (chunkTimerRef.current) {
      window.clearTimeout(chunkTimerRef.current);
      chunkTimerRef.current = null;
    }

    if (activeRecorderRef.current && activeRecorderRef.current.state !== 'inactive') {
      try {
        activeRecorderRef.current.stop();
      } catch {}
    }
    activeRecorderRef.current = null;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {}
      audioCtxRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopAllRecording();
    };
  }, [stopAllRecording]);

  const startFallbackMediaRecorder = useCallback(async () => {
    if (!isRecordingRef.current || usingFallbackRecorderRef.current) return;
    usingFallbackRecorderRef.current = true;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicError('Voice dictation is not supported in this browser environment.');
      stopAllRecording();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      if (!isRecordingRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioCtxRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateMeter = () => {
          if (!isRecordingRef.current) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const normalized = Math.min(100, Math.round((avg / 90) * 100));
          setAudioLevel(normalized);
          if (avg > 10) {
            hadVoiceActivityRef.current = true;
          }
          animFrameRef.current = requestAnimationFrame(updateMeter);
        };
        animFrameRef.current = requestAnimationFrame(updateMeter);
      }

      if (typeof MediaRecorder === 'undefined') return;

      const supportedMime = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg',
      ].find((m) => MediaRecorder.isTypeSupported(m)) || '';

      const startSingleSegment = () => {
        if (!isRecordingRef.current || !stream.active) return;

        try {
          const chunks: BlobPart[] = [];
          const recorder = supportedMime
            ? new MediaRecorder(stream, { mimeType: supportedMime })
            : new MediaRecorder(stream);

          activeRecorderRef.current = recorder;
          hadVoiceActivityRef.current = false;

          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              chunks.push(e.data);
            }
          };

          recorder.onstop = () => {
            const shouldTranscribe = hadVoiceActivityRef.current;
            const segmentBlob = new Blob(chunks, {
              type: recorder.mimeType || supportedMime || 'audio/webm',
            });

            if (shouldTranscribe && segmentBlob.size > 1200) {
              transcribeAudioBlob(
                segmentBlob,
                recorder.mimeType || supportedMime || 'audio/webm'
              );
            }

            if (isRecordingRef.current && stream.active) {
              startSingleSegment();
            }
          };

          recorder.start();

          chunkTimerRef.current = window.setTimeout(() => {
            if (recorder.state === 'recording') {
              try {
                recorder.stop();
              } catch {}
            }
          }, 6000);
        } catch (err) {
          console.error('MediaRecorder segment error:', err);
        }
      };

      startSingleSegment();
    } catch {
      setMicError(
        'Microphone access was blocked or unavailable. Please allow microphone permissions in your browser.'
      );
      stopAllRecording();
    }
  }, [stopAllRecording, transcribeAudioBlob]);

  const startRecording = useCallback(() => {
    if (isRecordingRef.current) return;

    setMicError(null);
    baseNotesRef.current = notes.trim();
    accumulatedFinalRef.current = '';
    sessionFinalRef.current = '';
    sessionInterimRef.current = '';
    usingFallbackRecorderRef.current = false;
    isRecordingRef.current = true;
    setIsRecording(true);
    setAudioLevel(35);

    textareaRef.current?.focus();

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = 0; i < event.results.length; i++) {
            const piece = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += piece + ' ';
            } else {
              interimTranscript += piece;
            }
          }

          sessionFinalRef.current = finalTranscript.trim();
          sessionInterimRef.current = interimTranscript.trim();
          setLiveInterimText(sessionInterimRef.current);
          setAudioLevel(sessionInterimRef.current ? 75 : 35);

          if (sessionFinalRef.current || sessionInterimRef.current) {
            syncScratchpadNotes();
          }
        };

        recognition.onerror = (event: any) => {
          const errCode = event?.error;
          if (errCode === 'no-speech') {
            return;
          }
          if (errCode === 'not-allowed') {
            setMicError(
              'Microphone access was denied. Please allow microphone permissions in your browser settings.'
            );
            stopAllRecording();
            return;
          }
          // For network, service-not-allowed, or audio-capture errors in iframe, seamlessly switch to MediaRecorder fallback
          if (isRecordingRef.current && !usingFallbackRecorderRef.current) {
            try {
              recognition.onend = null;
              recognition.stop();
            } catch {}
            recognitionRef.current = null;
            startFallbackMediaRecorder();
          }
        };

        recognition.onend = () => {
          if (sessionFinalRef.current) {
            accumulatedFinalRef.current = [
              accumulatedFinalRef.current,
              sessionFinalRef.current,
            ]
              .filter(Boolean)
              .join(' ');
            sessionFinalRef.current = '';
            sessionInterimRef.current = '';
            setLiveInterimText('');
          }

          if (isRecordingRef.current && !usingFallbackRecorderRef.current) {
            try {
              recognition.start();
            } catch {}
          }
        };

        recognition.start();
        return;
      } catch {
        // Fall through to MediaRecorder fallback
      }
    }

    startFallbackMediaRecorder();
  }, [notes, startFallbackMediaRecorder, stopAllRecording, syncScratchpadNotes]);

  const toggleRecording = () => {
    if (isRecording) {
      stopAllRecording();
    } else {
      startRecording();
    }
  };

  // Support starting dictation directly from the Home Menu button
  useEffect(() => {
    if (autoStartDictation) {
      startRecording();
      onDictationStarted?.();
    }
  }, [autoStartDictation, startRecording, onDictationStarted]);

  const handleApplyTemplate = (idx: number) => {
    const t = RAW_TEMPLATES[idx];
    if (!t) return;
    if (isRecording) {
      stopAllRecording();
    }
    setTitle(t.title);
    setNotes(t.notes);
    baseNotesRef.current = t.notes;
    setMeetingType(t.type);
    setAttendeeInput(t.attendees.join(', '));
    setSelectedTemplateIndex(idx);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRecording) {
      stopAllRecording();
    }
    if (!notes.trim() || isProcessing) return;

    const attendeesList = attendeeInput
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    onAnalyze({
      rawNotes: notes.trim(),
      title: title.trim() || 'Meeting Notes',
      date,
      meetingType,
      attendees: attendeesList,
    });
  };

  const wordCount = notes.trim() ? notes.trim().split(/\s+/).length : 0;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
      {/* Header bar */}
      <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-850/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Meeting Notes Ingestion
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Paste messy scratchpad notes, bullet points, or dictate live with your microphone. The AI separates your personal commitments from team deliverables.
          </p>
        </div>

        {/* Quick Sample Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-zinc-400 font-medium">Try Sample:</span>
          {RAW_TEMPLATES.map((tmpl, idx) => (
            <button
              key={tmpl.name}
              type="button"
              onClick={() => handleApplyTemplate(idx)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border shadow-2xs transition-all ${
                selectedTemplateIndex === idx
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 text-indigo-700 dark:text-indigo-300'
                  : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              {tmpl.name.split(' ')[0]} {tmpl.type}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              if (isRecording) stopAllRecording();
              setTitle('');
              setNotes('');
              baseNotesRef.current = '';
              setDate(new Date().toISOString().split('T')[0]);
              setMeetingType('sync');
              setAttendeeInput(userName);
              setSelectedTemplateIndex(null);
            }}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-all flex items-center gap-1"
            title="Clear form for a blank meeting"
          >
            <RotateCcw className="w-3 h-3" />
            Clear
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
              Meeting Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q4 Sprint Planning"
              required
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
              Meeting Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
              Type / Format
            </label>
            <select
              value={meetingType}
              onChange={(e) => setMeetingType(e.target.value as any)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="sprint">Sprint / Engineering Sync</option>
              <option value="sync">Product / Cross-Functional</option>
              <option value="one_on_one">Executive 1-on-1</option>
              <option value="client">Client / External Discovery</option>
              <option value="all_hands">All-Hands / Leadership</option>
              <option value="brainstorm">Brainstorm / Roadmap</option>
              <option value="other">Other Meeting</option>
            </select>
          </div>
        </div>

        {/* Attendees */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
            Key Attendees (Comma-separated)
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={attendeeInput}
              onChange={(e) => setAttendeeInput(e.target.value)}
              placeholder="e.g. Alex Rivera, Sarah Chen, Marcus Brody, David Kim"
              className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Include names so the engine can accurately match team tasks to specific owners. Your profile is set to: <strong className="text-indigo-600 dark:text-indigo-400">{userName}</strong>.
          </p>
        </div>

        {/* Text Area for Notes */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
              Raw Meeting Notes & Scratchpad
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleRecording}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isRecording
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20 ring-2 ring-rose-500/30'
                    : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
                }`}
                title={isRecording ? 'Click to stop microphone dictation' : 'Open microphone and dictate meeting notes in real time'}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-3.5 h-3.5 animate-pulse" />
                    <span>Stop Dictating</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Voice Dictate</span>
                  </>
                )}
              </button>
              <span className="text-xs text-zinc-400">{wordCount} words</span>
            </div>
          </div>

          {/* Live Microphone Recording Status Banner */}
          {isRecording && (
            <div className="mb-2.5 px-3.5 py-2.5 rounded-xl bg-rose-50/90 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                </span>
                <span className="text-xs font-bold text-rose-800 dark:text-rose-200 truncate">
                  {liveInterimText
                    ? `Encoding: "${liveInterimText}"`
                    : isTranscribingChunk
                    ? 'Encoding spoken audio into scratchpad...'
                    : 'Microphone open — speak now to encode notes in real time...'}
                </span>
              </div>

              {/* Live Audio Level Indicator */}
              <div className="flex items-center gap-2 shrink-0">
                <Radio className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <div className="w-24 h-2 bg-rose-200/70 dark:bg-rose-900/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-600 dark:bg-rose-400 rounded-full transition-all duration-75"
                    style={{ width: `${Math.max(8, audioLevel)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Microphone Error Callout */}
          {micError && (
            <div className="mb-2.5 px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{micError}</span>
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={notes}
            onChange={(e) => {
              const val = e.target.value;
              setNotes(val);
              baseNotesRef.current = val;
              accumulatedFinalRef.current = '';
              sessionFinalRef.current = '';
              sessionInterimRef.current = '';
            }}
            rows={10}
            required
            placeholder="Paste raw notes here or click 'Voice Dictate' to speak... e.g.&#10;- David kicked off the sync. Checkout bugs dropped conversion by 4%. Alex: I'll audit the mobile Safari CSS by today 5pm.&#10;- Sarah will finish the Figma token specs by Tuesday EOD.&#10;- Marcus: 'Someone needs to check why Postgres CPU hit 88%...'&#10;- Feature freeze confirmed for Friday Oct 23."
            className={`w-full p-4 font-mono text-xs sm:text-sm leading-relaxed bg-zinc-50 dark:bg-zinc-850 border rounded-2xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 resize-y transition-colors ${
              isRecording
                ? 'border-rose-400 dark:border-rose-600 focus:ring-rose-500 bg-rose-50/10'
                : 'border-zinc-200 dark:border-zinc-700 focus:ring-indigo-500'
            }`}
          />
        </div>

        {/* Submit Bar */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>AI will extract personal to-dos, team tasks, deadlines, and flag ambiguities.</span>
          </div>

          <button
            type="submit"
            disabled={!notes.trim() || isProcessing}
            className={`px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${
              isProcessing
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/20 active:scale-[0.98]'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
            {isProcessing ? 'Analyzing & Verifying Notes...' : 'Transform Into Action Checklist'}
          </button>
        </div>
      </form>
    </div>
  );
};

