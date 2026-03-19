package com.crossfitkorea.domain.notification.repository;

import com.crossfitkorea.domain.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserEmailOrderByCreatedAtDesc(String email);

    long countByUserEmailAndReadFalse(String email);

    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.user.email = :email AND n.read = false")
    void markAllReadByEmail(@Param("email") String email);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.user.email = :email AND n.read = true")
    void deleteReadByEmail(@Param("email") String email);
}
