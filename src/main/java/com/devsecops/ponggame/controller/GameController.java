package com.devsecops.ponggame.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Controller to serve the Pong Game pages
 */
@Controller
public class GameController {

    /**
     * Serves the main Pong game page
     */
    @GetMapping("/")
    public String home() {
        return "index";
    }

    /**
     * Serves the game page directly
     */
    @GetMapping("/game")
    public String game() {
        return "index";
    }
}
