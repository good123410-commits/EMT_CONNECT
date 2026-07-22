import { useEffect, useState } from 'react';
import { CommunitySubNav } from '../components/CommunitySubNav';
import { PageHero } from '../components/PageHero';
import { SKILL_LEVEL_LABELS, SKILL_TREE } from '../constants/skillTree';
import { fetchPublishedSkillNodes } from '../services/skillService';
import type { SkillNode } from '../services/adminService';

export function SkillsPage() {
  const [nodes, setNodes] = useState<SkillNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchPublishedSkillNodes()
      .then((rows) => {
        if (rows.length > 0) setNodes(rows);
        else {
          setNodes(
            SKILL_TREE.map((s, i) => ({
              id: s.id,
              level: s.level,
              title: s.title,
              description: s.description,
              prerequisites: s.prerequisites ?? [],
              recommended_courses: '',
              display_order: i,
              is_published: true,
              created_at: '',
              updated_at: '',
            })),
          );
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container page-content">
      <PageHero
        eyebrow="KEMIX Community"
        title="스킬 테크 트리"
        subtitle="응급구조사 차세대 표준 교육·진로 가이드"
        dark
      />
      <CommunitySubNav />
      {loading ? <p className="muted">불러오는 중…</p> : null}
      <div className="skill-tree">
        {nodes.map((node) => (
          <article key={node.id} className={`skill-node skill-node--${node.level}`}>
            <span className="skill-level">{SKILL_LEVEL_LABELS[node.level]}</span>
            <h3>{node.title}</h3>
            <p>{node.description}</p>
            {node.recommended_courses ? (
              <p className="skill-prereq">권장: {node.recommended_courses}</p>
            ) : null}
            {node.prerequisites?.length ? (
              <p className="skill-prereq">선행: {node.prerequisites.join(', ')}</p>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
