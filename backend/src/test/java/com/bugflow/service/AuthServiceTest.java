package com.bugflow.service;

import com.bugflow.config.JwtUtils;
import com.bugflow.model.User;
import com.bugflow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtils jwtUtils;

    private AuthService authService;

    @BeforeEach
    public void setup() {
        authService = new AuthService(userRepository, passwordEncoder, jwtUtils);
    }

    @Test
    public void testRegister_Success() {
        String name = "Test Tester";
        String email = "tester@test.com";
        String password = "password123";
        String role = "Tester";

        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());
        when(passwordEncoder.encode(password)).thenReturn("hashed_password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });
        when(jwtUtils.generateToken(any(), any(), any(), any(), any())).thenReturn("mock_token");

        AuthService.AuthResponse response = authService.register(name, email, password, role);

        assertNotNull(response);
        assertEquals("mock_token", response.getToken());
        assertEquals(email, response.getUser().getEmail());
        assertEquals(role, response.getUser().getRole());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    public void testRegister_UserAlreadyExists() {
        String email = "existing@test.com";
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(new User()));

        assertThrows(IllegalArgumentException.class, () -> {
            authService.register("Name", email, "password", "Tester");
        });
    }

    @Test
    public void testLogin_Success() {
        String email = "tester@test.com";
        String password = "password123";
        
        User user = User.builder()
                .id(1L)
                .name("Test Tester")
                .email(email)
                .password("hashed_password")
                .role("Tester")
                .build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(password, "hashed_password")).thenReturn(true);
        when(jwtUtils.generateToken(any(), any(), any(), any(), any())).thenReturn("mock_token");

        AuthService.AuthResponse response = authService.login(email, password);

        assertNotNull(response);
        assertEquals("mock_token", response.getToken());
        assertEquals(email, response.getUser().getEmail());
    }

    @Test
    public void testLogin_InvalidCredentials() {
        String email = "tester@test.com";
        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> {
            authService.login(email, "password");
        });
    }
}
