package com.bugflow.service;

import com.bugflow.config.JwtUtils;
import com.bugflow.model.User;
import com.bugflow.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final RestTemplate restTemplate;

    @Value("${github.client.id}")
    private String githubClientId;

    @Value("${github.client.secret}")
    private String githubClientSecret;

    @Value("${github.frontend.redirect}")
    private String githubFrontendRedirect;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtils jwtUtils) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
        this.restTemplate = new RestTemplate();
    }

    public AuthResponse register(String name, String email, String password, String role) {
        Optional<User> existing = userRepository.findByEmail(email);
        if (existing.isPresent()) {
            throw new IllegalArgumentException("User already exists");
        }

        User user = User.builder()
                .name(name)
                .email(email)
                .password(passwordEncoder.encode(password))
                .role(role != null ? role : "Tester")
                .build();

        userRepository.save(user);

        String token = jwtUtils.generateToken(user.getId(), user.getEmail(), user.getRole(), user.getName(), user.getAvatar());
        return new AuthResponse(token, user);
    }

    public AuthResponse login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid Credentials"));

        if (user.getPassword() == null || !passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("Invalid Credentials");
        }

        String token = jwtUtils.generateToken(user.getId(), user.getEmail(), user.getRole(), user.getName(), user.getAvatar());
        return new AuthResponse(token, user);
    }

    public User getMe(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public String handleGithubCallback(String code) {
        try {
            // 1. Exchange code for access token
            String tokenUrl = "https://github.com/login/oauth/access_token";
            Map<String, String> tokenRequest = new HashMap<>();
            tokenRequest.put("client_id", githubClientId);
            tokenRequest.put("client_secret", githubClientSecret);
            tokenRequest.put("code", code);

            HttpHeaders headers = new HttpHeaders();
            headers.set("Accept", "application/json");
            HttpEntity<Map<String, String>> tokenEntity = new HttpEntity<>(tokenRequest, headers);

            ResponseEntity<Map> tokenRes = restTemplate.postForEntity(tokenUrl, tokenEntity, Map.class);
            Map<String, Object> tokenBody = tokenRes.getBody();

            if (tokenBody == null || !tokenBody.containsKey("access_token")) {
                throw new IllegalStateException("Failed to obtain access token from GitHub");
            }

            String accessToken = (String) tokenBody.get("access_token");

            // 2. Fetch user details from GitHub
            String userUrl = "https://api.github.com/user";
            HttpHeaders userHeaders = new HttpHeaders();
            userHeaders.set("Authorization", "Bearer " + accessToken);
            userHeaders.set("User-Agent", "BugFlow-App");
            HttpEntity<String> userEntity = new HttpEntity<>(userHeaders);

            ResponseEntity<Map> userRes = restTemplate.exchange(userUrl, HttpMethod.GET, userEntity, Map.class);
            Map<String, Object> githubUser = userRes.getBody();

            if (githubUser == null || !githubUser.containsKey("id")) {
                throw new IllegalStateException("Failed to fetch user info from GitHub");
            }

            String githubId = githubUser.get("id").toString();
            String login = (String) githubUser.get("login");
            String name = (String) githubUser.get("name");
            String avatarUrl = (String) githubUser.get("avatar_url");
            String email = (String) githubUser.get("email");

            if (email == null) {
                email = login + "@github.com";
            }

            User user = userRepository.findByGithubId(githubId).orElse(null);

            if (user == null) {
                // Try to find user by email to link accounts
                user = userRepository.findByEmail(email).orElse(null);

                if (user != null) {
                    user.setGithubId(githubId);
                    user.setGithubUsername(login);
                    user.setGithubAccessToken(accessToken);
                    if (user.getAvatar() == null) {
                        user.setAvatar(avatarUrl);
                    }
                } else {
                    // Create a new user
                    user = User.builder()
                            .name(name != null ? name : login)
                            .email(email)
                            .role("Developer")
                            .githubId(githubId)
                            .githubUsername(login)
                            .githubAccessToken(accessToken)
                            .avatar(avatarUrl)
                            .build();
                }
            } else {
                user.setGithubAccessToken(accessToken);
                user.setGithubUsername(login);
                user.setAvatar(avatarUrl);
            }

            userRepository.save(user);

            // Generate JWT token
            return jwtUtils.generateToken(user.getId(), user.getEmail(), user.getRole(), user.getName(), user.getAvatar());

        } catch (Exception e) {
            System.err.println("GitHub Authentication Error: " + e.getMessage());
            throw new RuntimeException("GitHub authentication failed", e);
        }
    }

    @lombok.AllArgsConstructor
    @lombok.Getter
    public static class AuthResponse {
        private final String token;
        private final User user;
    }
}
