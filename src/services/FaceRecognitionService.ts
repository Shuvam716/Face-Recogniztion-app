import * as faceapi from '@vladmandic/face-api';

export interface RecognizedFace {
  name: string;
  descriptor: Float32Array;
}

class FaceRecognitionService {
  private modelsLoaded = false;
  private faceMatcher: faceapi.FaceMatcher | null = null;
  private registeredFaces: RecognizedFace[] = [];

  async loadModels() {
    if (this.modelsLoaded) return;

    const MODEL_URL = '/models';
    try {
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      this.modelsLoaded = true;
      console.log('Face Recognition Models Loaded');
      this.loadRegisteredFaces();
    } catch (error) {
      console.error('Error loading models:', error);
      throw error;
    }
  }

  private async loadRegisteredFaces() {
    try {
      const response = await fetch('/api/faces');
      if (!response.ok) throw new Error('API Sync Failed');
      const faces = await response.json();

      this.registeredFaces = faces.map((f: any) => ({
        name: f.name,
        descriptor: new Float32Array(f.descriptor),
      }));
      this.updateFaceMatcher();
      console.log('✓ Biometric Registry synced with Cloud Vault');
    } catch (error) {
      console.error('✗ Cloud Sync Error, falling back to cached state:', error);
    }
  }

  private updateFaceMatcher() {
    if (this.registeredFaces.length > 0) {
      const labeledDescriptors = this.registeredFaces.map(
        (f) => new faceapi.LabeledFaceDescriptors(f.name, [f.descriptor])
      );
      this.faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
    } else {
      this.faceMatcher = null;
    }
  }

  async detectFaces(input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement) {
    if (!this.modelsLoaded) await this.loadModels();

    return await faceapi
      .detectAllFaces(input)
      .withFaceLandmarks()
      .withFaceDescriptors();
  }

  async recognizeFace(descriptor: Float32Array) {
    if (!this.faceMatcher) return 'Unknown';
    const bestMatch = this.faceMatcher.findBestMatch(descriptor);
    return bestMatch.toString();
  }

  async registerFace(name: string, descriptor: Float32Array) {
    try {
      const response = await fetch('/api/faces/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, descriptor: Array.from(descriptor) })
      });

      if (response.ok) {
        this.registeredFaces.push({ name, descriptor });
        this.updateFaceMatcher();
      } else {
        throw new Error('Cloud Commit Failed');
      }
    } catch (error) {
      console.error('Biometric Registration Error:', error);
      throw error;
    }
  }

  getRegisteredFacesCount() {
    return this.registeredFaces.length;
  }

  async clearRegisteredFaces() {
    try {
      const response = await fetch('/api/faces/purge', { method: 'DELETE' });
      if (response.ok) {
        this.registeredFaces = [];
        this.updateFaceMatcher();
      }
    } catch (error) {
      console.error('Vault Purge Error:', error);
    }
  }

}

export const faceRecognitionService = new FaceRecognitionService();
