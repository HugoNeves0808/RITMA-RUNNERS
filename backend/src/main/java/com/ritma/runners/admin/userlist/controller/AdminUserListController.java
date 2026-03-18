package com.ritma.runners.admin.userlist.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ritma.runners.admin.userlist.dto.AdminUserListItemResponse;
import com.ritma.runners.admin.userlist.service.AdminUserListService;

@RestController
@RequestMapping("/api/admin/users")
@CrossOrigin(origins = "http://localhost:5173")
public class AdminUserListController {

    private final AdminUserListService adminUserListService;

    public AdminUserListController(AdminUserListService adminUserListService) {
        this.adminUserListService = adminUserListService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<AdminUserListItemResponse> listUsers(@RequestParam(required = false) String search,
                                                     @RequestParam(defaultValue = "false") boolean onlyAdmins,
                                                     @RequestParam(defaultValue = "false") boolean staleOnly) {
        return adminUserListService.listUsers(search, onlyAdmins, staleOnly);
    }
}
