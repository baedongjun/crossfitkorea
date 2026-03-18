package com.crossfitkorea;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb;MODE=PostgreSQL",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
    "spring.data.redis.host=localhost",
    "spring.data.redis.port=6379",
    "spring.data.redis.password=",
    "jwt.secret=test-secret-key-must-be-at-least-256-bits-long-for-hs256",
    "jwt.expiration=86400000",
    "jwt.refresh-expiration=604800000",
    "aws.access-key=test",
    "aws.secret-key=test",
    "aws.s3.bucket=test-bucket",
    "aws.s3.region=ap-northeast-2",
    "toss.payments.secret-key=test-toss-secret-key",
    "toss.payments.client-key=test-toss-client-key"
})
class CrossfitkoreaApplicationTests {

    @Test
    void contextLoads() {
    }
}
