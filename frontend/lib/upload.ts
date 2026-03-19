import api from "./api";
import { ApiResponse } from "@/types";

/**
 * S3 Presigned URL 기반 직접 업로드
 * 서버를 거치지 않고 S3에 직접 파일을 PUT하여 업로드 속도를 개선합니다.
 *
 * @param file 업로드할 파일
 * @param folder S3 폴더 (기본값: "general")
 * @returns 업로드된 파일의 공개 URL
 */
export async function uploadViaPresignedUrl(file: File, folder = "general"): Promise<string> {
  // 1. presigned URL 요청
  const res = await api.get<ApiResponse<{ presignedUrl: string; key: string; publicUrl: string }>>(
    "/api/v1/upload/presigned",
    {
      params: { filename: file.name, folder, contentType: file.type },
    }
  );
  const { presignedUrl, publicUrl } = res.data.data;

  // 2. S3에 직접 PUT
  await fetch(presignedUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });

  return publicUrl;
}
