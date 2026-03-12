package com.ritma.runners.auth.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.ritma.runners.auth.entity.AppUser;

@Repository
public class AppUserRepository {

    private final ObjectProvider<JdbcTemplate> jdbcTemplateProvider;

    public AppUserRepository(ObjectProvider<JdbcTemplate> jdbcTemplateProvider) {
        this.jdbcTemplateProvider = jdbcTemplateProvider;
    }

    public Optional<AppUser> findByEmail(String email) {
        JdbcTemplate jdbcTemplate = jdbcTemplate();
        String sql = """
                SELECT id, email, password_hash, role::text AS role, force_password_change
                FROM users
                WHERE lower(email) = lower(?)
                """;

        return jdbcTemplate.query(sql, this::mapRow, email).stream().findFirst();
    }

    public Optional<AppUser> findById(UUID userId) {
        JdbcTemplate jdbcTemplate = jdbcTemplate();
        String sql = """
                SELECT id, email, password_hash, role::text AS role, force_password_change
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
                INSERT INTO users (id, email, password_hash, role, force_password_change)
                VALUES (?, ?, ?, CAST(? AS user_role), ?)
                """,
                UUID.randomUUID(),
                email,
                passwordHash,
                "ADMIN",
                true
        );
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
                rs.getBoolean("force_password_change")
        );
    }
}
