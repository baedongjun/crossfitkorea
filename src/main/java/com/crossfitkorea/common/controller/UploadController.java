package com.crossfitkorea.common.controller;

import com.crossfitkorea.common.ApiResponse;
import com.crossfitkorea.common.service.S3UploadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/upload")
@RequiredArgsConstructor
@Tag(name = "Upload", description = "파일 업로드 API")
public class UploadController {

    private final S3UploadService s3UploadService;

    private static final long MAX_SIZE = 10 * 1024 * 1024; // 10MB
    private static final List<String> ALLOWED_TYPES = List.of(
        "image/jpeg", "image/png", "image/webp", "image/gif"
    );

    @Operation(summary = "이미지 단일 업로드")
    @PostMapping("/image")
    public ResponseEntity<ApiResponse<String>> uploadImage(
        @RequestParam("file") MultipartFile file,
        @RequestParam(value = "folder", defaultValue = "general") String folder
    ) throws IOException {
        validateFile(file);
        String url = s3UploadService.upload(file, folder);
        return ResponseEntity.ok(ApiResponse.success(url));
    }

    @Operation(summary = "이미지 다중 업로드 (최대 5장)")
    @PostMapping("/images")
    public ResponseEntity<ApiResponse<List<String>>> uploadImages(
        @RequestParam("files") List<MultipartFile> files,
        @RequestParam(value = "folder", defaultValue = "general") String folder
    ) throws IOException {
        if (files.size() > 5) {
            throw new com.crossfitkorea.common.exception.BusinessException(
                com.crossfitkorea.common.exception.ErrorCode.INVALID_INPUT_VALUE);
        }
        List<String> urls = new ArrayList<>();
        for (MultipartFile file : files) {
            validateFile(file);
            urls.add(s3UploadService.upload(file, folder));
        }
        return ResponseEntity.ok(ApiResponse.success(urls));
    }

    @Operation(summary = "Presigned URL 발급 (S3 직접 업로드용)", description = "10분간 유효한 Presigned PUT URL을 반환합니다.")
    @GetMapping("/presigned")
    public ResponseEntity<ApiResponse<Map<String, String>>> getPresignedUrl(
        @RequestParam String filename,
        @RequestParam(defaultValue = "general") String folder,
        @RequestParam(defaultValue = "image/jpeg") String contentType
    ) {
        Map<String, String> result = s3UploadService.generatePresignedUrl(folder, filename, contentType);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new com.crossfitkorea.common.exception.BusinessException(
                com.crossfitkorea.common.exception.ErrorCode.INVALID_INPUT_VALUE);
        }
        if (file.getSize() > MAX_SIZE) {
            throw new com.crossfitkorea.common.exception.BusinessException(
                com.crossfitkorea.common.exception.ErrorCode.INVALID_INPUT_VALUE);
        }
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new com.crossfitkorea.common.exception.BusinessException(
                com.crossfitkorea.common.exception.ErrorCode.INVALID_INPUT_VALUE);
        }
    }
}
