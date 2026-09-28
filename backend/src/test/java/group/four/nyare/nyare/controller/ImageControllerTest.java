package group.four.nyare.nyare.controller;

import group.four.nyare.nyare.dto.ImageUploadResponse;
import group.four.nyare.nyare.model.Image;
import group.four.nyare.nyare.service.ImageService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ImageController.class)
class ImageControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ImageService imageService;

    @MockitoBean
    private JpaMetamodelMappingContext jpaMappingContext;

    @Test
    void uploadImage_returns201AndLocationHeader() throws Exception {
        UUID id = UUID.randomUUID();
        ImageUploadResponse response = new ImageUploadResponse(id, "/api/images/" + id, "image/png", 100L, Instant.now());
        when(imageService.uploadImage(any())).thenReturn(response);

        MockMultipartFile file = new MockMultipartFile("file", "test.png", "image/png", new byte[]{1, 2, 3});

        mockMvc.perform(multipart("/api/images").file(file))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/images/" + id))
                .andExpect(jsonPath("$.id").value(id.toString()))
                .andExpect(jsonPath("$.url").value("/api/images/" + id));
    }

    @Test
    void getImage_returns200AndCacheHeader() throws Exception {
        UUID id = UUID.randomUUID();
        Image image = new Image(new byte[]{1, 2, 3}, "image/png", "test.png", 3L);
        when(imageService.getImage(id)).thenReturn(image);

        mockMvc.perform(get("/api/images/{id}", id))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "image/png"))
                .andExpect(header().exists("Cache-Control"));
    }

    @Test
    void deleteImage_returns204() throws Exception {
        UUID id = UUID.randomUUID();
        doNothing().when(imageService).deleteImage(id);

        mockMvc.perform(delete("/api/images/{id}", id))
                .andExpect(status().isNoContent());

        verify(imageService).deleteImage(id);
    }
}
