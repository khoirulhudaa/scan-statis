import * as faceapi from 'face-api.js';
import { useEffect, useState } from 'react';

export const useFaceApi = () => {
    const [isLoaded, setIsLoaded] = useState(false);

    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

    useEffect(() => {
        const load = async () => {
            try {
                console.log('[face-api] mulai load models...');
                await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
                console.log('[face-api] tinyFaceDetector ✅');
                await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
                console.log('[face-api] faceLandmark68Net ✅');
                await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
                console.log('[face-api] faceRecognitionNet ✅');
                setIsLoaded(true);
            } catch (err) {
                console.error('[face-api] GAGAL:', err);
            }
        };
        load();
    }, []);

    // useEffect(() => {
    //     const load = async () => {
    //         await Promise.all([
    //             faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    //             faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    //             faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    //         ]);
    //         setIsLoaded(true);
    //         console.log('[face-api] models loaded');
    //     };
    //     load().catch(console.error);
    // }, []);

    const getDescriptor = async (videoEl: HTMLVideoElement) => {
        const result = await faceapi
            .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();
        return result?.descriptor ?? null; // Float32Array(128) | null
    };

    const compareDescriptors = (d1: Float32Array, d2: number[]) => {
        const d2Float = new Float32Array(d2);
        const distance = faceapi.euclideanDistance(d1, d2Float);
        return { distance, match: distance < 0.45 };
    };

    return { isLoaded, getDescriptor, compareDescriptors };
};