package group.four.nyare.nyare.controller;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.webmvc.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Controller forwarding unmapped non-API requests to index.html for Vue Router.
 */
@Controller
public class SpaController implements ErrorController {

    @RequestMapping("/error")
    public Object handleError(HttpServletRequest request, HttpServletResponse response) {
        Integer status = (Integer) request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        String path = (String) request.getAttribute(RequestDispatcher.ERROR_REQUEST_URI);

        if (status != null && status == HttpStatus.NOT_FOUND.value()
                && path != null && !path.startsWith("/api/")) {
            response.setStatus(HttpStatus.OK.value());
            return "forward:/index.html";
        }
        return ResponseEntity.status(status != null ? status : 500).build();
    }
}
