package com.ritma.runners.admin.userlist.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.ritma.runners.admin.userlist.dto.AdminUserListItemResponse;
import com.ritma.runners.auth.repository.AppUserRepository;

@Service
public class AdminUserListService {

    private final AppUserRepository appUserRepository;

    public AdminUserListService(AppUserRepository appUserRepository) {
        this.appUserRepository = appUserRepository;
    }

    public List<AdminUserListItemResponse> listUsers(String search, boolean onlyAdmins, boolean staleOnly) {
        return appUserRepository.findActiveUsersForAdminList(search, onlyAdmins, staleOnly);
    }
}
