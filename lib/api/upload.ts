import api from "@/app/config/api";

export interface UploadResponse {
  url: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

export const uploadFile = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/api/v1/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.data;
};

export const uploadImageToCloudinary = async (file: File): Promise<string> => {

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'hanazoom_preset'); 

  const response = await fetch('https:
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('이미지 업로드에 실패했습니다.');
  }

  const data = await response.json();
  return data.secure_url;
};


const compressImage = (file: File, maxWidth: number = 400, quality: number = 0.5): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {

      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;


      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);


      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('이미지 압축에 실패했습니다.'));
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => reject(new Error('이미지 로드에 실패했습니다.'));
    img.src = URL.createObjectURL(file);
  });
};


export const uploadImageToLocal = async (file: File): Promise<string> => {
  try {

    const compressedFile = await compressImage(file, 300, 0.3);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        console.log(`이미지 압축 결과: 원본 ${(file.size / 1024 / 1024).toFixed(2)}MB → 압축 ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
        console.log(`Base64 문자열 길이: ${result.length}자`);
        console.log(`Base64 문자열 미리보기: ${result.substring(0, 100)}...`);
        

        if (result.length > 270000) {
          console.warn('Base64 문자열이 너무 깁니다. 더 강력한 압축을 시도합니다.');

          compressImage(file, 200, 0.2).then(ultraCompressed => {
            const reader2 = new FileReader();
            reader2.onload = (e2) => {
              const ultraResult = e2.target?.result as string;
              console.log(`초강력 압축 결과: ${(ultraCompressed.size / 1024 / 1024).toFixed(2)}MB, Base64 길이: ${ultraResult.length}자`);
              resolve(ultraResult);
            };
            reader2.readAsDataURL(ultraCompressed);
          }).catch(() => resolve(result));
        } else {
          resolve(result);
        }
      };
      reader.onerror = () => reject(new Error('파일 읽기에 실패했습니다.'));
      reader.readAsDataURL(compressedFile);
    });
  } catch (error) {
    console.error('이미지 압축 실패, 원본 파일 사용:', error);

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve(result);
      };
      reader.onerror = () => reject(new Error('파일 읽기에 실패했습니다.'));
      reader.readAsDataURL(file);
    });
  }
};
