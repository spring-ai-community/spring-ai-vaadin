package org.spring.framework.ai.vaadin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import com.vaadin.flow.component.page.AppShellConfigurator;
import com.vaadin.flow.component.page.Push;

@Push
@SpringBootApplication
public class SpringAiVaadinApplication implements AppShellConfigurator{

	public static void main(String[] args) {
		SpringApplication.run(SpringAiVaadinApplication.class, args);
	}

}
