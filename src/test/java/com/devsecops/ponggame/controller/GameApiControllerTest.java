package com.devsecops.ponggame.controller;

import com.devsecops.ponggame.service.GameRoomService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(GameApiController.class)
class GameApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private GameRoomService gameRoomService;

    @Test
    void testGetGameInfo() throws Exception {
        mockMvc.perform(get("/api/info"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("DevSecOps Pong Game"))
                .andExpect(jsonPath("$.version").value("3.1.0"))
                .andExpect(jsonPath("$.mode").value("Online Multiplayer"))
                .andExpect(jsonPath("$.status").value("running"));
    }

    @Test
    void testHealthCheck() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.application").value("Pong Game"))
                .andExpect(jsonPath("$.version").value("3.1.0"));
    }
}
