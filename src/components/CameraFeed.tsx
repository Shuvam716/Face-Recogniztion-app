import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { faceRecognitionService } from '../services/FaceRecognitionService';
import { RefreshCw, AlertCircle, Scan, Fingerprint, X } from 'lucide-react';

interface CameraFeedProps {
    mode: 'recognize' | 'register';
    onRegisterSubmit?: (name: string, descriptor: Float32Array) => void;
}

const CameraFeed: React.FC<CameraFeedProps> = ({ mode, onRegisterSubmit }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isRegistering, setIsRegistering] = useState(false);
    const [registerName, setRegisterName] = useState('');
    const [currentDescriptor, setCurrentDescriptor] = useState<Float32Array | null>(null);

    const startVideo = useCallback(async () => {
        setIsLoading(true);
        setCameraError(null);
        try {
            await faceRecognitionService.loadModels();

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: "user"
                }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    setIsLoading(false);
                };
            }
        } catch (err: any) {
            setCameraError(err.message || 'Biometric Link Failed');
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        startVideo();
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [startVideo]);

    useEffect(() => {
        let animationId: number;
        const runDetection = async () => {
            if (!videoRef.current || !canvasRef.current || videoRef.current.paused || videoRef.current.readyState < 2) {
                animationId = requestAnimationFrame(runDetection);
                return;
            }

            const { clientWidth, clientHeight } = videoRef.current;
            if (clientWidth === 0) {
                animationId = requestAnimationFrame(runDetection);
                return;
            }

            if (canvasRef.current.width !== clientWidth || canvasRef.current.height !== clientHeight) {
                canvasRef.current.width = clientWidth;
                canvasRef.current.height = clientHeight;
            }

            const detections = await faceRecognitionService.detectFaces(videoRef.current);
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, clientWidth, clientHeight);

                if (detections.length > 0) {
                    const resized = faceapi.resizeResults(detections, { width: clientWidth, height: clientHeight });
                    for (const det of resized) {
                        const descriptor = det.descriptor;
                        const match = await faceRecognitionService.recognizeFace(descriptor);
                        const name = match.split(' ')[0];
                        const { x, y, width, height } = det.detection.box;

                        // Recalculate X for mirrored display
                        const mirroredX = clientWidth - x - width;

                        const color = name !== 'Unknown' ? '#10b981' : '#3b82f6';
                        ctx.strokeStyle = color;
                        ctx.lineWidth = 2;
                        const p = 12;
                        const s = 15;

                        // Draw Brackets
                        ctx.beginPath(); ctx.moveTo(mirroredX - p, y - p + s); ctx.lineTo(mirroredX - p, y - p); ctx.lineTo(mirroredX - p + s, y - p); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(mirroredX + width + p - s, y - p); ctx.lineTo(mirroredX + width + p, y - p); ctx.lineTo(mirroredX + width + p, y - p + s); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(mirroredX - p, y + height + p - s); ctx.lineTo(mirroredX - p, y + height + p); ctx.lineTo(mirroredX - p + s, y + height + p); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(mirroredX + width + p - s, y + height + p); ctx.lineTo(mirroredX + width + p, y + height + p); ctx.lineTo(mirroredX + width + p, y + height + p - s); ctx.stroke();

                        // ID Label
                        ctx.fillStyle = color;
                        const labelText = name !== 'Unknown' ? `IDENTITY_MATCH: ${name}` : 'AUTHENTICATING...';
                        ctx.font = 'bold 9px "JetBrains Mono", monospace';
                        const textWidth = ctx.measureText(labelText).width;
                        ctx.fillRect(mirroredX - p, y - p - 18, textWidth + 12, 16);
                        ctx.fillStyle = '#000';
                        ctx.fillText(labelText, mirroredX - p + 6, y - p - 6);

                        // Analysis Overlay
                        if (name !== 'Unknown') {
                            ctx.fillStyle = 'rgba(16, 185, 129, 0.05)';
                            ctx.fillRect(mirroredX - p, y - p, width + p * 2, height + p * 2);
                        }
                    }
                }
            }

            animationId = requestAnimationFrame(runDetection);
        };

        animationId = requestAnimationFrame(runDetection);
        return () => cancelAnimationFrame(animationId);
    }, [isLoading]);

    const handleCapture = async () => {
        if (!videoRef.current) return;
        setIsRegistering(true);
        const detections = await faceRecognitionService.detectFaces(videoRef.current);
        if (detections.length > 0) {
            setCurrentDescriptor(detections[0].descriptor);
        } else {
            alert('Biometric sync interrupted. Please reposition face.');
            setIsRegistering(false);
        }
    };

    const submitRegistration = () => {
        if (registerName && currentDescriptor && onRegisterSubmit) {
            onRegisterSubmit(registerName, currentDescriptor);
            setRegisterName('');
            setCurrentDescriptor(null);
            setIsRegistering(false);
        }
    };

    return (
        <div className="scanner-shell">
            <div className="scanner-viewport">
                <div className="hud-scan-overlay" />

                <div className="scanner-mirror-layer">
                    {cameraError ? (
                        <div className="flex-center-full h-full p-8" style={{ transform: 'scaleX(-1)' }}>
                            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                            <p className="font-mono text-[10px] text-red-500 uppercase tracking-widest">{cameraError}</p>
                            <button onClick={startVideo} className="btn-action btn-ghost mt-6 px-4 py-2 text-[10px]">Reset Protocol</button>
                        </div>
                    ) : (
                        <>
                            <video ref={videoRef} autoPlay muted playsInline className="scanner-video" />
                            <canvas ref={canvasRef} className="scanner-canvas" />
                        </>
                    )}

                    {isLoading && !cameraError && (
                        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-20" style={{ transform: 'scaleX(-1)' }}>
                            <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                            <p className="font-tech text-blue-500 text-[10px] tracking-[0.4em] uppercase">Syncing_Neurolink</p>
                        </div>
                    )}
                </div>
            </div>
<br></br>
            <div className="control-surface-tactical">
                {mode === 'register' ? (
                    isRegistering ? (
                        <div className="animate-fade-in-up">
                            <span className="label-mini text-center w-full">Input Biological Key</span>
                            <input
                                type="text"
                                placeholder="PROXIMITY_NAME"
                                value={registerName}
                                onChange={(e) => setRegisterName(e.target.value.toUpperCase())}
                                className="input-tactical"
                            />
                            <div className="flex-row-stack gap-3">
                                <button onClick={submitRegistration} disabled={!registerName} className="btn-action" style={{ flex: 3 }}>
                                    <Fingerprint className="w-5 h-5" /> Commit Pattern
                                </button>&nbsp;
                                <button onClick={() => setIsRegistering(false)} className="btn-action btn-ghost" style={{ flex: 1 }}>
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={handleCapture} className="btn-action animate-pulse-slow">
                            <Scan className="w-6 h-6" />
                            Enrol Biometrics
                        </button>
                    )
                ) : (
                    <div className="status-readout card">
                        <div className="flex-row-between">
                            <div className="v-stack-tight">
                                <span className="label-mini mb-0">Identity Protection</span>
                                <h4 className="font-tech text-sm tracking-wider uppercase">Active Perimeter Scan</h4>
                            </div>
                            <div className="pulse-emerald" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CameraFeed;


