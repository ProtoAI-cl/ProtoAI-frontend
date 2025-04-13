import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import * as tf from "@tensorflow/tfjs";
import * as cam from "@mediapipe/camera_utils";
import {
  FACEMESH_TESSELATION,
  HAND_CONNECTIONS,
  POSE_CONNECTIONS,
  Holistic,
  Results,
} from "@mediapipe/holistic";
import { drawConnectors } from "@mediapipe/drawing_utils";
import { reshape } from "mathjs";

const CameraComponent: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActivated, setCameraActivated] = useState(false);
  const [sent, setSent] = useState("");
  const [showLoadingMessage, setShowLoadingMessage] = useState(false);

  const actions = ["A", "B", "C", "D"];
  let kpSequence: number[][] = [];
  let countFrame = 0;

  useEffect(() => {
    let camera: cam.Camera | null = null;

    const initializeHolisticAndCamera = async () => {
      try {
        setShowLoadingMessage(true);

        const model = await tf.loadLayersModel(
          "https://abecedario-lsch.s3.us-south.cloud-object-storage.appdomain.cloud/model.json"
        );

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

        holistic.onResults((results: Results) =>
          onResults(results, model)
        );

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
        setShowLoadingMessage(false);
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

  const onResults = async (results: Results, model: tf.LayersModel) => {
    const keypoints = extractKeyPoints(results);
    kpSequence.push(keypoints);

    if (kpSequence.length > 15 && thereHand(results)) {
      countFrame++;
    } else if (countFrame >= 5) {
      const kpArray = reshape(kpSequence.slice(-15), [1, 15, 126]);
      const tensor = tf.tensor(kpArray);
      const prediction = model.predict(tensor) as tf.Tensor;
      const probabilities = prediction.dataSync();
      const maxIndex = probabilities.indexOf(Math.max(...probabilities));

      if (probabilities[maxIndex] > 0.2) {
        const detectedAction = actions[maxIndex];
        setSent(detectedAction);
        console.log("Prediction:", detectedAction);

        // Enviar la detección al backend
        await sendDetectionToBackend(detectedAction);
      }

      kpSequence = [];
      countFrame = 0;
    }

    drawResults(results);
  };
//Envia el json correspondiente a la seña detectada
  const sendDetectionToBackend = async (detection: string) => {
    try {
      // Ruta del archivo JSON correspondiente
      const jsonPath = `/json/${detection}.json`;
  
      // Cargar el archivo JSON
      const response = await fetch(jsonPath);
      if (!response.ok) {
        throw new Error(`Error al cargar el archivo JSON: ${response.status}`);
      }
  
      const motionData = await response.json();
  
      // Enviar el archivo JSON al backend (Cambiar según la api de la prótesis)
      const backendResponse = await fetch("http://127.0.0.1:8000/api/detecciones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(motionData),
      });
  
      if (!backendResponse.ok) {
        throw new Error(`Error en el servidor: ${backendResponse.status}`);
      }
  
      const data = await backendResponse.json();
      console.log("JSON enviado exitosamente:", data);
    } catch (error) {
      console.error("Error al enviar el JSON al backend:", error);
    }
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

  const extractKeyPoints = (results: Results): number[] => {
    const lh =
      results.leftHandLandmarks?.map((point) => [
        point.x ?? 0,
        point.y ?? 0,
        point.z ?? 0,
      ]).flat() || new Array(21 * 3).fill(0);

    const rh =
      results.rightHandLandmarks?.map((point) => [
        point.x ?? 0,
        point.y ?? 0,
        point.z ?? 0,
      ]).flat() || new Array(21 * 3).fill(0);

    return [...lh, ...rh];
  };

  const thereHand = (results: Results) =>
    !!results.leftHandLandmarks || !!results.rightHandLandmarks;

  return (
    <div>
      {showLoadingMessage && <p>Cargando modelo...</p>}
      {cameraActivated ? (
        <>
          <Webcam
            ref={webcamRef}
            style={{
              display: "none", // Oculta el video original
            }}
          />
          <canvas
            ref={canvasRef}
            style={{
              width: 640,
              height: 480,
            }}
          />
          <button onClick={() => setCameraActivated(false)}>
            Desactivar Cámara
          </button>
        </>
      ) : (
        <button onClick={() => setCameraActivated(true)}>Activar Cámara</button>
      )}

      {sent && <p>Última detección: {sent}</p>}
    </div>
  );
};

export default CameraComponent;


// import React, { useRef, useState, useEffect } from "react";
// import Webcam from "react-webcam";
// import * as tf from "@tensorflow/tfjs";
// import * as cam from "@mediapipe/camera_utils";
// import {
//   FACEMESH_TESSELATION,
//   HAND_CONNECTIONS,
//   POSE_CONNECTIONS,
//   Holistic,
//   Results,
// } from "@mediapipe/holistic";
// import { drawConnectors } from "@mediapipe/drawing_utils";
// import { reshape } from "mathjs";

// const CameraComponent: React.FC = () => {
//   const webcamRef = useRef<Webcam>(null);
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const [cameraActivated, setCameraActivated] = useState(false);
//   const [sent, setSent] = useState("");
//   const [showLoadingMessage, setShowLoadingMessage] = useState(false);

//   const actions = ["A", "B", "C", "D"];
//   let kpSequence: number[][] = [];
//   let countFrame = 0;

//   useEffect(() => {
//     let camera: cam.Camera | null = null;

//     const initializeHolisticAndCamera = async () => {
//       try {
//         setShowLoadingMessage(true);

//         const model = await tf.loadLayersModel(
//           "https://abecedario-lsch.s3.us-south.cloud-object-storage.appdomain.cloud/model.json"
//         );

//         const holistic = new Holistic({
//           locateFile: (file) =>
//             `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
//         });

//         holistic.setOptions({
//           modelComplexity: 0,
//           smoothLandmarks: true,
//           enableSegmentation: false,
//           smoothSegmentation: true,
//           refineFaceLandmarks: false,
//           minDetectionConfidence: 0.7,
//           minTrackingConfidence: 0.5,
//         });

//         holistic.onResults((results: Results) =>
//           onResults(results, model)
//         );

//         if (webcamRef.current && webcamRef.current.video) {
//           camera = new cam.Camera(webcamRef.current.video, {
//             onFrame: async () =>
//               await holistic.send({ image: webcamRef.current!.video! }),
//             width: 640,
//             height: 480,
//           });
//           camera.start();
//         }
//       } catch (error) {
//         console.error("Error initializing Holistic or Camera:", error);
//       } finally {
//         setShowLoadingMessage(false);
//       }
//     };

//     if (cameraActivated) {
//       initializeHolisticAndCamera();
//     }

//     return () => {
//       if (camera) {
//         camera.stop();
//         camera = null;
//       }
//     };
//   }, [cameraActivated]);

//   const onResults = (results: Results, model: tf.LayersModel) => {
//     const keypoints = extractKeyPoints(results);
//     kpSequence.push(keypoints);

//     if (kpSequence.length > 15 && thereHand(results)) {
//       countFrame++;
//     } else if (countFrame >= 5) {
//       const kpArray = reshape(kpSequence.slice(-15), [1, 15, 126]);
//       const tensor = tf.tensor(kpArray);
//       const prediction = model.predict(tensor) as tf.Tensor;
//       const probabilities = prediction.dataSync();
//       const maxIndex = probabilities.indexOf(Math.max(...probabilities));

//       if (probabilities[maxIndex] > 0.2) {
//         const detectedAction = actions[maxIndex];
//         setSent(detectedAction);
//         console.log("Prediction:", detectedAction);
//       }

//       kpSequence = [];
//       countFrame = 0;
//     }

//     drawResults(results);
//   };

//   const drawResults = (results: Results) => {
//     if (!canvasRef.current || !webcamRef.current) return;

//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext("2d")!;
//     const videoWidth = webcamRef.current.video!.videoWidth;
//     const videoHeight = webcamRef.current.video!.videoHeight;

//     canvas.width = videoWidth;
//     canvas.height = videoHeight;

//     ctx.clearRect(0, 0, videoWidth, videoHeight);
//     ctx.drawImage(results.image!, 0, 0, videoWidth, videoHeight);

//     const connect = drawConnectors;
//     if (connect) {
//       connect(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
//         color: "#00FF00",
//         lineWidth: 4,
//       });
//       connect(ctx, results.faceLandmarks, FACEMESH_TESSELATION, {
//         color: "#C0C0C070",
//         lineWidth: 1,
//       });
//       connect(ctx, results.leftHandLandmarks, HAND_CONNECTIONS, {
//         color: "#CC0000",
//         lineWidth: 5,
//       });
//       connect(ctx, results.rightHandLandmarks, HAND_CONNECTIONS, {
//         color: "#00CC00",
//         lineWidth: 5,
//       });
//     }
//   };

//   const extractKeyPoints = (results: Results): number[] => {
//     const lh =
//       results.leftHandLandmarks?.map((point) => [
//         point.x ?? 0,
//         point.y ?? 0,
//         point.z ?? 0,
//       ]).flat() || new Array(21 * 3).fill(0);

//     const rh =
//       results.rightHandLandmarks?.map((point) => [
//         point.x ?? 0,
//         point.y ?? 0,
//         point.z ?? 0,
//       ]).flat() || new Array(21 * 3).fill(0);

//     return [...lh, ...rh];
//   };

//   const thereHand = (results: Results) =>
//     !!results.leftHandLandmarks || !!results.rightHandLandmarks;

//   return (
//     <div>
//       {showLoadingMessage && <p>Cargando modelo...</p>}
//       {cameraActivated ? (
//   <>
//     <Webcam
//       ref={webcamRef}
//       style={{
//         display: "none", // Oculta el video original
//       }}
//     />
//     <canvas
//       ref={canvasRef}
//       style={{
//         width: 640,
//         height: 480,
//       }}
//     />
//     <button onClick={() => setCameraActivated(false)}>
//       Desactivar Cámara
//     </button>
//   </>
// ) : (
//   <button onClick={() => setCameraActivated(true)}>Activar Cámara</button>
// )}

//       {sent && <p>Última detección: {sent}</p>}
//     </div>
//   );
// };

// export default CameraComponent;

// import React, {useRef, useState } from "react";
// import Webcam from "react-webcam";
// import * as tf from "@tensorflow/tfjs";
// import * as cam from "@mediapipe/camera_utils";
// import { FACEMESH_TESSELATION, HAND_CONNECTIONS, POSE_CONNECTIONS, Holistic, Results } from "@mediapipe/holistic";
// import { drawConnectors } from "@mediapipe/drawing_utils";
// import { reshape } from "mathjs";


// const CameraComponent: React.FC = () => {
  
//   const webcamRef = useRef<Webcam>(null);
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const [cameraActivated, setCameraActivated] = useState(false);
//   const [sent, setSent] = useState("");
//   const [showLoadingMessage, setShowLoadingMessage] = useState(false);

//   const actions = ["A", "B", "C", "D"];
//   let kpSequence: number[][] = [];
//   let countFrame = 0;

//   const loadModelAndHolistic = async () => {
//     try {
//       setShowLoadingMessage(true);
//       const model = await tf.loadLayersModel("https://abecedario-lsch.s3.us-south.cloud-object-storage.appdomain.cloud/model.json");
      
      
//       const holistic = new Holistic({
//         locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
//       });

//       holistic.setOptions({
//         modelComplexity: 0,
//         smoothLandmarks: true,
//         enableSegmentation: false,
//         smoothSegmentation: true,
//         refineFaceLandmarks: false,
//         minDetectionConfidence: 0.7,
//         minTrackingConfidence: 0.5,
//       });

//       holistic.onResults((results: Results) => onResults(results, model));
      
//       if (webcamRef.current && webcamRef.current.video) {
//         const camera = new cam.Camera(webcamRef.current.video, {
//           onFrame: async () => await holistic.send({ image: webcamRef.current!.video! }),
//           width: 640,
//           height: 480,
//         });
//         camera.start();
//       }
//     } catch (error) {
//       console.error("Error loading the model or MediaPipe:", error);
//     } finally {
//       setShowLoadingMessage(false);
//     }
//   };

//   const onResults = (results: Results, model: tf.LayersModel) => {
//     const keypoints = extractKeyPoints(results);
//     kpSequence.push(keypoints);

//     if (kpSequence.length > 15 && thereHand(results)) {
//       countFrame++;
//     } else if (countFrame >= 5) {
//       const kpArray = reshape(kpSequence.slice(-15), [1, 15, 126]);
//       const tensor = tf.tensor(kpArray);
//       const prediction = model.predict(tensor) as tf.Tensor;
//       const probabilities = prediction.dataSync();
//       const maxIndex = probabilities.indexOf(Math.max(...probabilities));

//       if (probabilities[maxIndex] > 0.2) {
//         const detectedAction = actions[maxIndex];
//         setSent(detectedAction);
//         console.log("Prediction:", detectedAction);
//       }

//       kpSequence = [];
//       countFrame = 0;
//     }

//     drawResults(results);
//   };

//   const drawResults = (results: Results) => {
//     if (!canvasRef.current || !webcamRef.current) return;
  
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext("2d")!;
//     const videoWidth = webcamRef.current.video!.videoWidth;
//     const videoHeight = webcamRef.current.video!.videoHeight;
  
//     canvas.width = videoWidth;
//     canvas.height = videoHeight;
  
//     ctx.clearRect(0, 0, videoWidth, videoHeight);
//     ctx.drawImage(results.image!, 0, 0, videoWidth, videoHeight);
  
//     const connect = drawConnectors;
//     if (connect) {
//       connect(ctx, results.poseLandmarks, POSE_CONNECTIONS, { color: "#00FF00", lineWidth: 4 });
//       connect(ctx, results.faceLandmarks, FACEMESH_TESSELATION, { color: "#C0C0C070", lineWidth: 1 });
//       connect(ctx, results.leftHandLandmarks, HAND_CONNECTIONS, { color: "#CC0000", lineWidth: 5 });
//       connect(ctx, results.rightHandLandmarks, HAND_CONNECTIONS, { color: "#00CC00", lineWidth: 5 });
//     }
//   };
  

//   const extractKeyPoints = (results: Results): number[] => {

  
//     const lh = results.leftHandLandmarks?.map((point) => [
//       point.x ?? 0,
//       point.y ?? 0,
//       point.z ?? 0,
//     ]).flat() || new Array(21 * 3).fill(0);
  
//     const rh = results.rightHandLandmarks?.map((point) => [
//       point.x ?? 0,
//       point.y ?? 0,
//       point.z ?? 0,
//     ]).flat() || new Array(21 * 3).fill(0);
  
//     return [...lh, ...rh];
//   };  

//   const thereHand = (results: Results) => !!results.leftHandLandmarks || !!results.rightHandLandmarks;

//   const activateCamera = async () => {
//     setCameraActivated(true);
//     await loadModelAndHolistic();
//   };

//   const deactivateCamera = () => setCameraActivated(false);

//   return (
//     <div>
//       {showLoadingMessage && <p>Cargando modelo...</p>}
//       {cameraActivated ? (
//         <>
//           <Webcam ref={webcamRef} style={{ width: 640, height: 480 }} />
//           <canvas ref={canvasRef} style={{ width: 640, height: 480 }} />
//           <button onClick={deactivateCamera}>Desactivar Cámara</button>
//         </>
//       ) : (
//         <button onClick={activateCamera}>Activar Cámara</button>
//       )}
//       {sent && <p>Última detección: {sent}</p>}
//     </div>
//   );
// };

// export default CameraComponent;

