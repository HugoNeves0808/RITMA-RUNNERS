package com.ritma.runners.user_settings.controller;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.UUID;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.ritma.runners.auth.dto.JwtAuthenticatedUser;
import com.ritma.runners.user_settings.service.UserDataTransferService;

@RestController
@RequestMapping("/api/settings/data")
public class UserDataTransferController {
    private final UserDataTransferService userDataTransferService;

    public UserDataTransferController(UserDataTransferService userDataTransferService) {
        this.userDataTransferService = userDataTransferService;
    }

    @GetMapping("/export/json")
    public ResponseEntity<byte[]> exportJson(@AuthenticationPrincipal JwtAuthenticatedUser user) {
        UUID userId = requireAuthenticatedUserId(user);
        byte[] body = userDataTransferService.exportJson(userId).getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename("ritma-export-" + LocalDate.now() + ".json")
                        .build()
                        .toString())
                .contentType(MediaType.APPLICATION_JSON)
                .body(body);
    }

    @GetMapping("/export/sql")
    public ResponseEntity<byte[]> exportSql(@AuthenticationPrincipal JwtAuthenticatedUser user) {
        UUID userId = requireAuthenticatedUserId(user);
        byte[] body = userDataTransferService.exportSql(userId).getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename("ritma-export-" + LocalDate.now() + ".sql")
                        .build()
                        .toString())
                .contentType(new MediaType("application", "sql"))
                .body(body);
    }

    @GetMapping("/export/xlsx")
    public ResponseEntity<byte[]> exportExcel(@AuthenticationPrincipal JwtAuthenticatedUser user) {
        UUID userId = requireAuthenticatedUserId(user);
        byte[] body = userDataTransferService.exportExcel(userId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename("ritma-export-" + LocalDate.now() + ".xlsx")
                        .build()
                        .toString())
                .contentType(new MediaType("application", "vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(body);
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void importJson(@AuthenticationPrincipal JwtAuthenticatedUser user,
                           @RequestPart("file") MultipartFile file) {
        userDataTransferService.importJson(requireAuthenticatedUserId(user), file);
    }

    private UUID requireAuthenticatedUserId(JwtAuthenticatedUser user) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required.");
        }

        return user.id();
    }
}
