-- core の make publish-master と同じ文で、写したボードと NPC のアバターの game の内部 ID（domain_entities の行）を作る。
-- スターターセットの解放は、この内部 ID で NPC のアバターを指す。種類の表（domain_entity_types）は core が起動時に作るため、
-- master.sql（core の起動の前）ではなく、core が起動してから流す
INSERT INTO domain_entities (public_id, entity_type_id) SELECT b.board_id, t.id FROM boards b JOIN domain_entity_types t ON t.name = 'board' ON CONFLICT DO NOTHING;
INSERT INTO domain_entities (public_id, entity_type_id) SELECT a.npc_avatar_id, t.id FROM npc_avatars a JOIN domain_entity_types t ON t.name = 'npc_avatar' ON CONFLICT DO NOTHING;
