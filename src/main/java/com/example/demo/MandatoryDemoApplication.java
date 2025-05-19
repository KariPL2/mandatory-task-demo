package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@SpringBootApplication
public class MandatoryDemoApplication {

	public static void main(String[] args) {
		SpringApplication.run(MandatoryDemoApplication.class, args);
	}

	// *** DODAJ TĘ KLASĘ WEWNĘTRZNĄ LUB UTWÓRZ OSOBNY PLIK KONFIGURACYJNY ***
	@Configuration
	public static class SpaWebMvcConfigurer implements WebMvcConfigurer {

		/**
		 * Configures view controllers for Single Page Applications (SPA).
		 * This setup ensures that requests not handled by other controllers
		 * or static resources are forwarded to the index.html file.
		 */
		@Override
		public void addViewControllers(ViewControllerRegistry registry) {
			// This is a common pattern for SPAs.
			// It maps any request that hasn't been matched by other handlers
			// (like your REST controllers or static resource handlers)
			// to the index.html file.
			// The order is important: this should be the last mapping considered.
			// Spring Boot's default static resource handler will still serve
			// files like .js, .css, .png correctly before this mapping is considered.
			registry.addViewController("/").setViewName("forward:/index.html");
			registry.addViewController("/{path:^(?!api|assets)[^\\.]*}").setViewName("forward:/index.html");
			registry.addViewController("/{path:^(?!api|assets)[^\\.]*}/**").setViewName("forward:/index.html");

			// Explanation of the patterns:
			// "/" : Maps the root path.
			// "/{path:^(?!api|assets)[^\\.]*}" : Matches a single path segment that does NOT start with 'api' or 'assets'
			//                                    and does not contain a dot ('.').
			// "/**/{path:^(?!api|assets)[^\\.]*}/**" : Matches nested paths, ensuring they don't start with 'api' or 'assets'
			//                                          and the last segment before the final '/' does not contain a dot.
			//                                          This is a more complex pattern to try and avoid matching static resources.
			// "forward:/index.html" : Internally forwards the request to the index.html file in the static resources location.
		}

		// Resource handlers are typically automatically configured by Spring Boot
		// to serve from classpath:/static/, classpath:/public/, etc.
		// You usually don't need to override this unless you have custom locations.
		// @Override
		// public void addResourceHandlers(ResourceHandlerRegistry registry) {
		//     registry.addResourceHandler("/**")
		//             .addResourceLocations("classpath:/static/", "classpath:/public/");
		// }
	}

}
