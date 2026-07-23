package com.bugflow.repository;

import com.bugflow.model.Localization;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LocalizationRepository extends JpaRepository<Localization, Long> {
    List<Localization> findByBugIdOrderByRankAsc(Long bugId);
}
