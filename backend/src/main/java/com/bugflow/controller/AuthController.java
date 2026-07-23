package com.bugflow.controller;

import com.bugflow.config.CustomUserPrincipal;
import com.bugflow.model.User;
import com.bugflow.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping
public class AuthController {

    private final AuthService authService;

    @Value("${github.client.id}")
    private String githubClientId;

    @Value("${github.frontend.redirect}")
    private String githubFrontendRedirect;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // Direct Login/Register APIs
    @PostMapping("/api/auth/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        try {
            String name = body.get("name");
            String email = body.get("email");
            String password = body.get("password");
            String role = body.get("role");

            AuthService.AuthResponse response = authService.register(name, email, password, role);
            
            Map<String, Object> resBody = new HashMap<>();
            resBody.put("token", response.getToken());
            resBody.put("user", Map.of(
                    "id", response.getUser().getId(),
                    "name", response.getUser().getName(),
                    "email", response.getUser().getEmail(),
                    "role", response.getUser().getRole(),
                    "avatar", response.getUser().getAvatar() != null ? response.getUser().getAvatar() : ""
            ));
            return ResponseEntity.ok(resBody);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("msg", e.getMessage()));
        }
    }

    @PostMapping("/api/auth/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            String password = body.get("password");

            AuthService.AuthResponse response = authService.login(email, password);

            Map<String, Object> resBody = new HashMap<>();
            resBody.put("token", response.getToken());
            resBody.put("user", Map.of(
                    "id", response.getUser().getId(),
                    "name", response.getUser().getName(),
                    "email", response.getUser().getEmail(),
                    "role", response.getUser().getRole(),
                    "avatar", response.getUser().getAvatar() != null ? response.getUser().getAvatar() : ""
            ));
            return ResponseEntity.ok(resBody);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("msg", e.getMessage()));
        }
    }

    @GetMapping("/api/auth/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal CustomUserPrincipal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body(Map.of("msg", "Token is not valid"));
            }
            User user = authService.getMe(principal.getId());
            Map<String, Object> resBody = new HashMap<>();
            resBody.put("id", user.getId());
            resBody.put("name", user.getName());
            resBody.put("email", user.getEmail());
            resBody.put("role", user.getRole());
            resBody.put("githubId", user.getGithubId());
            resBody.put("githubUsername", user.getGithubUsername());
            resBody.put("avatar", user.getAvatar());
            return ResponseEntity.ok(resBody);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("msg", "Token is not valid"));
        }
    }

    @PostMapping("/api/auth/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok(Map.of("msg", "Logged out successfully"));
    }

    // GitHub OAuth redirect paths (supporting both api/auth/github and api/github/auth)
    @GetMapping({"/api/auth/github", "/api/github/auth"})
    public void githubRedirect(HttpServletResponse response) throws IOException {
        String url = String.format("https://github.com/login/oauth/authorize?client_id=%s&scope=repo read:user user:email", githubClientId);
        response.sendRedirect(url);
    }

    // GitHub OAuth callback paths (supporting both callback structures)
    @GetMapping({"/api/auth/github/callback", "/api/github/callback"})
    public void githubCallback(@RequestParam("code") String code, HttpServletResponse response) throws IOException {
        try {
            String token = authService.handleGithubCallback(code);
            response.sendRedirect(githubFrontendRedirect + "?token=" + token);
        } catch (Exception e) {
            response.sendRedirect(githubFrontendRedirect.substring(0, githubFrontendRedirect.lastIndexOf("/")) + "/login?error=github_auth_failed");
        }
    }
}
