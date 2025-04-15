import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import * as cam from "@mediapipe/camera_utils";
import {
    FACEMESH_TESSELATION,
    HAND_CONNECTIONS,
    POSE_CONNECTIONS,
    Holistic,
    Results,
} from "@mediapipe/holistic";
import { drawConnectors } from "@mediapipe/drawing_utils";
import "./camera.css";

const Camera: React.FC = () => {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [cameraActivated, setCameraActivated] = useState(false);
    const [leftHand, setLeftHand] = useState<string>("")
    const [rightHand, setRightHand] = useState<string>("")
    const [ipAddress, setIpAddress] = useState("127.0.0.1");
    const [port, setPort] = useState("8000");
    const [socket, setSocket] = useState<WebSocket | null>(null);


    const handleip = (event: React.ChangeEvent<HTMLInputElement>) => {
        setIpAddress(event.target.value);
    };

    const handleport = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPort(event.target.value);
    };

    const generate_sock = () => {
        if (ipAddress && port) {
            const ws = new WebSocket(`ws://${ipAddress}:${port}/ws`);

            ws.onopen = () => {
                console.log("WebSocket connection established");
                setSocket(ws);
            };

            ws.onerror = (error) => {
                console.error("WebSocket error:", error);
            };

            ws.onclose = () => {
                console.log("WebSocket connection closed");
                setSocket(null);
            };
        }

    };


    useEffect(() => {
        let camera: cam.Camera | null = null;

        const initializeHolisticAndCamera = async () => {
            try {

                const holistic = new Holistic({
                    locateFile: (file) =>
                        `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
                });

                holistic.setOptions({
                    modelComplexity: 0,
                    smoothLandmarks: true,
                    enableSegmentation: false,
                    smoothSegmentation: true,
                    refineFaceLandmarks: false,
                    minDetectionConfidence: 0.7,
                    minTrackingConfidence: 0.5,
                });

                holistic.onResults((results: Results) => onResults(results));

                if (webcamRef.current && webcamRef.current.video) {
                    camera = new cam.Camera(webcamRef.current.video, {
                        onFrame: async () =>
                            await holistic.send({ image: webcamRef.current!.video! }),
                        width: 640,
                        height: 480,
                    });
                    camera.start();
                }
            } catch (error) {
                console.error("Error initializing Holistic or Camera:", error);
            } finally {
            }
        };

        if (cameraActivated) {
            initializeHolisticAndCamera();
        }

        return () => {
            if (camera) {
                camera.stop();
                camera = null;
            }
        };
    }, [cameraActivated]);
    useEffect(() => {
        return () => {
            if (socket) {
                socket.close();
            }
        };
    }, [socket]);
    const onResults = (results: Results) => {
        const [left, right] = extractKeyPoints(results);

        // Update UI states
        setLeftHand(JSON.stringify(left, null, 2));
        setRightHand(JSON.stringify(right, null, 2));

        // Send fresh data (combine both hands)
        if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ left, right }));
        }

        drawResults(results);
    };

    const drawResults = (results: Results) => {
        if (!canvasRef.current || !webcamRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d")!;
        const videoWidth = webcamRef.current.video!.videoWidth;
        const videoHeight = webcamRef.current.video!.videoHeight;

        canvas.width = videoWidth;
        canvas.height = videoHeight;
        ctx.clearRect(0, 0, videoWidth, videoHeight);
        ctx.drawImage(results.image!, 0, 0, videoWidth, videoHeight);

        const connect = drawConnectors;
        if (connect) {
            connect(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
                color: "#00FF00",
                lineWidth: 4,
            });
            connect(ctx, results.faceLandmarks, FACEMESH_TESSELATION, {
                color: "#C0C0C070",
                lineWidth: 1,
            });
            connect(ctx, results.leftHandLandmarks, HAND_CONNECTIONS, {
                color: "#CC0000",
                lineWidth: 5,
            });
            connect(ctx, results.rightHandLandmarks, HAND_CONNECTIONS, {
                color: "#00CC00",
                lineWidth: 5,
            });
        }
    };

    const extractKeyPoints = (results: Results): number[][] => {
        const lh =
            results.leftHandLandmarks?.map((point) => [
                point.x ?? 0,
                point.y ?? 0,
                point.z ?? 0,
            ]).flat() || new Array(63).fill(0);

        const rh =
            results.rightHandLandmarks?.map((point) => [
                point.x ?? 0,
                point.y ?? 0,
                point.z ?? 0,
            ]).flat() || new Array(21 * 3).fill(0);

        const leftHand: number[] = [...lh]
        const rightHand: number[] = [...rh]

        return [leftHand, rightHand]
    };

    return (
        <div className="fullContainer">
            {cameraActivated ? (
                <>
                    <div className="camera_container">
                        <Webcam
                            ref={webcamRef}
                            style={{
                                display: "none",
                            }}
                        />
                        <canvas
                            ref={canvasRef}
                            style={{
                                width: 640,
                                height: 480,
                            }}
                        />
                    </div>

                    <div>
                        <button onClick={() => setCameraActivated(false)}>
                            Desactivar Cámara
                        </button>
                    </div>
                    <div className="keypoints">
                        <pre>Keypoints Left hand: {leftHand}</pre>
                        <pre>Keypoints Right hand: {rightHand}</pre>
                    </div>
                </>
            ) : (
                <button onClick={() => setCameraActivated(true)}>Activar Cámara</button>
            )}

            <div>
                <form >
                    <div>
                        <label >Destiny IP:</label>
                        <input onChange={handleip} value={ipAddress} type="text" id="fname" name="fname" />
                    </div>
                    <div>
                        <label >Destiny Port:</label>
                        <input onChange={handleport} value={port} type="text" id="lname" name="lname" />
                    </div>

                </form>
                <button onClick={generate_sock}>Transmitir datos</button>
            </div>
        </div>

    );
};

export default Camera;
