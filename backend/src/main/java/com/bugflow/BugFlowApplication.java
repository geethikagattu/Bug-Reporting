package com.bugflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class BugFlowApplication {
    public static void main(String[] args) {
        SpringApplication.run(BugFlowApplication.class, args);
    }
}
