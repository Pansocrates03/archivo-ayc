import { SQL } from "bun";
import { S3Client } from "@aws-sdk/client-s3";

if(!process.env.DATABASE_URL) {
  console.warn("Warning: DATABASE_URL environment variable is not set. Database connection may fail.");
}

if(!process.env.S3_ENDPOINT || !process.env.S3_REGION) {
  console.warn("Warning: S3_ENDPOINT and/or S3_REGION environment variables are not set. S3 operations may fail.");
}

if (!process.env.ILOVEPDF_PUBLIC_KEY || !process.env.ILOVEPDF_SECRET_KEY) {
  console.warn("⚠ ILOVEPDF_PUBLIC_KEY y ILOVEPDF_SECRET_KEY no configurados. La compresión de PDF fallará sin estas credenciales.");
}

export const pg = new SQL(process.env.DATABASE_URL || "");

const IS_LOCAL = process.env.NODE_ENV !== "production";
export const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION,
  credentials: { accessKeyId: process.env.S3_ACCESS_KEY || "minioadmin", secretAccessKey: process.env.S3_SECRET_KEY || "minioadmin" },
  forcePathStyle: IS_LOCAL,
});

export const ilovepdf = {
  compressPdf: async (inputPath: string, outputPath: string): Promise<string> => {
    try {
      const ILOVEPDF_API_URL = "https://api.ilovepdf.com/v1";
      const ILOVEPDF_PUBLIC_KEY = process.env.ILOVEPDF_PUBLIC_KEY;
      const ILOVEPDF_SECRET_KEY = process.env.ILOVEPDF_SECRET_KEY;
      
      console.log("Iniciando compresión de PDF con iLovePDF API...");

      if(!ILOVEPDF_PUBLIC_KEY || !ILOVEPDF_SECRET_KEY) {
        console.warn("⚠ ILOVEPDF credentials no configurados, usando PDF sin comprimir");
        const fileContent = await Bun.file(inputPath).arrayBuffer();
        await Bun.write(outputPath, new Uint8Array(fileContent));
        return outputPath;
      }
      
      // 1. Obtener token de autenticación
      const authFormData = new FormData();
      authFormData.append("public_key", ILOVEPDF_PUBLIC_KEY);
      
      const authRes = await fetch(`${ILOVEPDF_API_URL}/auth`, {
        method: "POST",
        body: authFormData
      });
      
      const authData = await authRes.json();
      console.log("Auth response:", authData);
      
      if(!authData.token) {
        console.warn("⚠ Error al obtener token:", authData);
        const fileContent = await Bun.file(inputPath).arrayBuffer();
        await Bun.write(outputPath, new Uint8Array(fileContent));
        return outputPath;
      }

      const token = authData.token;

      // 2. Iniciar tarea de compresión (GET /start/compress)
      const startRes = await fetch(`${ILOVEPDF_API_URL}/start/compress`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      const startData = await startRes.json();
      console.log("Start response:", startData);
      
      if(!startData.task || !startData.server) {
        console.warn("⚠ Error al iniciar compresión:", startData);
        const fileContent = await Bun.file(inputPath).arrayBuffer();
        await Bun.write(outputPath, new Uint8Array(fileContent));
        return outputPath;
      }

      const taskId = startData.task;
      const serverUrl = `https://${startData.server}/v1`;

      // 3. Subir el archivo
      const uploadFormData = new FormData();
      uploadFormData.append("task", taskId);
      uploadFormData.append("file", await Bun.file(inputPath));
      
      const uploadRes = await fetch(`${serverUrl}/upload`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: uploadFormData
      });
      
      const uploadData = await uploadRes.json();
      console.log("Upload response:", uploadData);

      if(!uploadData.server_filename) {
        console.warn("⚠ Error al subir archivo:", uploadData);
        const fileContent = await Bun.file(inputPath).arrayBuffer();
        await Bun.write(outputPath, new Uint8Array(fileContent));
        return outputPath;
      }

      const serverFilename = uploadData.server_filename;
      const originalFilename = inputPath.split("/").pop() || "document.pdf";

      // 4. Procesar el archivo con parámetros requeridos
      const processRes = await fetch(`${serverUrl}/process`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          task: taskId,
          tool: "compress",
          files: [{
            server_filename: serverFilename,
            filename: originalFilename
          }],
          compression_level: "recommended"
        })
      });
      
      const processData = await processRes.json();
      console.log("Process response:", processData);

      if(processData.status !== "TaskSuccess" && processData.status !== "TaskSuccessWithWarnings") {
        console.warn("⚠ Error al procesar archivo:", processData);
        const fileContent = await Bun.file(inputPath).arrayBuffer();
        await Bun.write(outputPath, new Uint8Array(fileContent));
        return outputPath;
      }

      // 5. Descargar el archivo comprimido
      const downloadRes = await fetch(`${serverUrl}/download/${taskId}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if(!downloadRes.ok) {
        console.warn("⚠ Error al descargar PDF comprimido");
        const fileContent = await Bun.file(inputPath).arrayBuffer();
        await Bun.write(outputPath, new Uint8Array(fileContent));
        return outputPath;
      }

      const arrayBuffer = await downloadRes.arrayBuffer();
      await Bun.write(outputPath, new Uint8Array(arrayBuffer));
      
      const originalSize = (await Bun.file(inputPath).stat())?.size || 0;
      const compressedSize = arrayBuffer.byteLength;
      const savings = ((1 - compressedSize / originalSize) * 100).toFixed(1);
      console.log(`✓ PDF comprimido: ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(compressedSize / 1024 / 1024).toFixed(2)}MB (ahorro: ${savings}%)`);
      
      return outputPath;
    } catch (error) {
      console.error("Error en compresión de PDF con iLovePDF:", error);
      // En caso de error, devolver el PDF original sin comprimir
      const fileContent = await Bun.file(inputPath).arrayBuffer();
      await Bun.write(outputPath, new Uint8Array(fileContent));
      return outputPath;
    }
  }
}