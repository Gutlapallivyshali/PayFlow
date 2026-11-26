package com.payflow.service;

import com.payflow.dto.request.LoginRequest;
import com.payflow.dto.request.RegisterUserRequest;
import com.payflow.dto.response.AuthResponse;
import com.payflow.dto.response.UserResponse;
import com.payflow.entity.User;
import com.payflow.enums.UserRole;
import com.payflow.exception.DuplicateResourceException;
import com.payflow.exception.ResourceNotFoundException;
import com.payflow.repository.UserRepository;
import com.payflow.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
    }

    @Transactional
    public AuthResponse register(RegisterUserRequest request) {
        String cleanUsername = request.getUsername().trim();
        String cleanEmail = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByUsername(cleanUsername)) {
            throw new DuplicateResourceException("Username '" + cleanUsername + "' is already registered.");
        }
        if (userRepository.existsByEmail(cleanEmail)) {
            throw new DuplicateResourceException("Email '" + cleanEmail + "' is already registered.");
        }

        User user = new User(
                cleanUsername,
                cleanEmail,
                passwordEncoder.encode(request.getPassword()),
                request.getRole() != null ? request.getRole() : UserRole.CUSTOMER
        );

        User savedUser = userRepository.save(user);
        log.info("User registered successfully: [id={}, username={}, role={}]", savedUser.getId(), savedUser.getUsername(), savedUser.getRole());

        String token = tokenProvider.generateTokenForUsername(savedUser.getUsername(), "ROLE_" + savedUser.getRole().name());

        return new AuthResponse(
                token,
                savedUser.getUsername(),
                savedUser.getEmail(),
                savedUser.getRole(),
                tokenProvider.getExpirationMs()
        );
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String cleanUsername = request.getUsername().trim();

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(cleanUsername, request.getPassword())
        );

        User user = userRepository.findByUsername(cleanUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + cleanUsername));

        String token = tokenProvider.generateToken(authentication);
        log.info("User [{}] authenticated successfully.", cleanUsername);

        return new AuthResponse(
                token,
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                tokenProvider.getExpirationMs()
        );
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
        return UserResponse.fromEntity(user);
    }
}
