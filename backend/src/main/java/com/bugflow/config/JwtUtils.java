package com.bugflow.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtUtils {

    private final Key key;
    private final long expirationMs;

    public JwtUtils(@Value("${jwt.secret}") String secret, @Value("${jwt.expiration}") long expirationMs) {
        this.expirationMs = expirationMs;
        Key tempKey;
        try {
            byte[] decodedKey = Base64.getDecoder().decode(secret);
            tempKey = Keys.hmacShaKeyFor(decodedKey);
        } catch (Exception e) {
            tempKey = Keys.hmacShaKeyFor(secret.getBytes());
        }
        this.key = tempKey;
    }

    public String generateToken(Long id, String email, String role, String name, String avatar) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("id", id);
        claims.put("email", email);
        claims.put("role", role);
        claims.put("name", name);
        claims.put("avatar", avatar);

        // Also mock the nested "user" claim for compatibility with Express backend token structure
        Map<String, Object> nestedUser = new HashMap<>();
        nestedUser.put("id", id);
        nestedUser.put("role", role);
        claims.put("user", nestedUser);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public Claims getClaimsFromToken(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
    }

    public String getEmailFromToken(String token) {
        return getClaimsFromToken(token).getSubject();
    }

    public Long getIdFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        Object idVal = claims.get("id");
        if (idVal instanceof Number) {
            return ((Number) idVal).longValue();
        }
        // Fallback to checking nested user claims
        Map<?, ?> userMap = (Map<?, ?>) claims.get("user");
        if (userMap != null) {
            Object nestedId = userMap.get("id");
            if (nestedId instanceof Number) {
                return ((Number) nestedId).longValue();
            }
        }
        return null;
    }

    public String getRoleFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        String role = (String) claims.get("role");
        if (role == null) {
            Map<?, ?> userMap = (Map<?, ?>) claims.get("user");
            if (userMap != null) {
                role = (String) userMap.get("role");
            }
        }
        return role;
    }
}
