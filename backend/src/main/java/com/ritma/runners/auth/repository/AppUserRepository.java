package com.ritma.runners.auth.repository;

import java.util.Optional;
import java.util.UUID;
import java.util.List;
import java.time.OffsetDateTime;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.ritma.runners.auth.entity.AppUser;
import com.ritma.runners.admin.pendingapproval.dto.PendingApprovalResponse;
import com.ritma.runners.auth.dto.PendingAccountResponse;

@Repository
public class AppUserRepository {

    private final ObjectProvider<JdbcTemplate> jdbcTemplateProvider;

    public AppUserRepository(ObjectProvider<JdbcTemplate> jdbcTemplateProvider) {
        this.jdbcTemplateProvider = jdbcTemplateProvider;
    }

    public Optional<AppUser> findByEmail(String email) {
        JdbcTemplate jdbcTemplate = jdbcTemplate();
        String sql = """
                SELECT id, email, password_hash, role::text AS role, force_password_change, account_status::text AS account_status
                FROM users
                WHERE lower(email) = lower(?)
                """;

        return jdbcTemplate.query(sql, this::mapRow, email).stream().findFirst();
    }

    public Optional<AppUser> findById(UUID userId) {
        JdbcTemplate jdbcTemplate = jdbcTemplate();
        String sql = """
                SELECT id, email, password_hash, role::text AS role, force_password_change, account_status::text AS account_status
                FROM users
                WHERE id = ?
                """;

        return jdbcTemplate.query(sql, this::mapRow, userId).stream().findFirst();
    }

    public boolean existsByEmail(String email) {
        JdbcTemplate jdbcTemplate = jdbcTemplate();
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE lower(email) = lower(?)",
                Integer.class,
                email
        );
        return count != null && count > 0;
    }

    public void createAdminUser(String email, String passwordHash) {
        JdbcTemplate jdbcTemplate = jdbcTemplate();
        jdbcTemplate.update("""
                INSERT INTO users (id, email, password_hash, role, force_password_change, account_status)
                VALUES (?, ?, ?, CAST(? AS user_role), ?, CAST(? AS account_status))
                """,
                UUID.randomUUID(),
                email,
                passwordHash,
                "ADMIN",
                true,
                "ACTIVE"
        );
    }

    public AppUser createUser(String email,
                              String passwordHash,
                              String role,
                              boolean forcePasswordChange,
                              String accountStatus) {
        JdbcTemplate jdbcTemplate = jdbcTemplate();
        UUID userId = UUID.randomUUID();

        jdbcTemplate.update("""
                INSERT INTO users (id, email, password_hash, role, force_password_change, account_status)
                VALUES (?, ?, ?, CAST(? AS user_role), ?, CAST(? AS account_status))
                """,
                userId,
                email,
                passwordHash,
                role,
                forcePasswordChange,
                accountStatus
        );

        return new AppUser(userId, email, passwordHash, role, forcePasswordChange, accountStatus);
    }

    public void createDefaultUserSettings(UUID userId) {
        JdbcTemplate jdbcTemplate = jdbcTemplate();
        jdbcTemplate.update("""
                INSERT INTO user_settings (user_id)
                VALUES (?)
                """,
                userId
        );
    }

    public void updatePassword(UUID userId, String passwordHash, boolean forcePasswordChange) {
        JdbcTemplate jdbcTemplate = jdbcTemplate();
        jdbcTemplate.update("""
                UPDATE users
                SET password_hash = ?, force_password_change = ?
                WHERE id = ?
                """,
                passwordHash,
                forcePasswordChange,
                userId
        );
    }

    public void updatePasswordAndStatus(UUID userId,
                                        String passwordHash,
                                        boolean forcePasswordChange,
                                        String accountStatus) {
        JdbcTemplate jdbcTemplate = jdbcTemplate();
        jdbcTemplate.update("""
                UPDATE users
                SET password_hash = ?, force_password_change = ?, account_status = CAST(? AS account_status)
                WHERE id = ?
                """,
                passwordHash,
                forcePasswordChange,
                accountStatus,
                userId
        );
    }

    public void updateAccountStatus(UUID userId, String accountStatus) {
        JdbcTemplate jdbcTemplate = jdbcTemplate();
        jdbcTemplate.update("""
                UPDATE users
                SET account_status = CAST(? AS account_status)
                WHERE id = ?
                """,
                accountStatus,
                userId
        );
    }

    public List<PendingAccountResponse> findPendingAccounts() {
        return findPendingApprovals().stream()
                .map(approval -> new PendingAccountResponse(
                        approval.id(),
                        approval.email(),
                        approval.accountStatus(),
                        approval.requestedAt()
                ))
                .toList();
    }

    public List<PendingApprovalResponse> findPendingApprovals() {
        JdbcTemplate jdbcTemplate = jdbcTemplate();
        return jdbcTemplate.query("""
                SELECT id, email, account_status::text AS account_status, created_at
                FROM users
                WHERE account_status::text = 'PENDING'
                ORDER BY created_at ASC
                """,
                (rs, rowNum) -> new PendingApprovalResponse(
                        rs.getObject("id", UUID.class),
                        rs.getString("email"),
                        rs.getString("account_status"),
                        rs.getObject("created_at", OffsetDateTime.class)
                )
        );
    }

    public void deleteUser(UUID userId) {
        JdbcTemplate jdbcTemplate = jdbcTemplate();
        jdbcTemplate.update("DELETE FROM users WHERE id = ?", userId);
    }

    private JdbcTemplate jdbcTemplate() {
        JdbcTemplate jdbcTemplate = jdbcTemplateProvider.getIfAvailable();
        if (jdbcTemplate == null) {
            throw new IllegalStateException("JdbcTemplate is not available");
        }
        return jdbcTemplate;
    }

    private AppUser mapRow(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        return new AppUser(
                rs.getObject("id", UUID.class),
                rs.getString("email"),
                rs.getString("password_hash"),
                rs.getString("role"),
                rs.getBoolean("force_password_change"),
                rs.getString("account_status")
        );
    }
}
