-- make test の core_game に入れるマスタ（公開中のカード 3 枚・公開中のスターターデッキ 2 つ・game_rules・ボード）。
-- core の make publish-master（studio の read model の行を game の DB に写す）の結果と同じ形の行を、固定の値で入れる。
-- 行の形は core の migrations（cards・starter_decks・game_rules・boards）と、tests/testhelper/master.go（PublishMaster）に合わせてある。
-- カード A・B・C は、デッキ 1 に A を 4 枚・B を 1 枚、デッキ 2 に A を 2 枚・B を 3 枚・C を 2 枚入れる
INSERT INTO cards (card_id, card_type, sort_name, status, metadata) VALUES
  ('00000000-0000-4000-8000-00000000000a', 1, 'a', 'published', '{"id":"00000000-0000-4000-8000-00000000000a","name":"A","status":"published"}'),
  ('00000000-0000-4000-8000-00000000000b', 1, 'b', 'published', '{"id":"00000000-0000-4000-8000-00000000000b","name":"B","status":"published"}'),
  ('00000000-0000-4000-8000-00000000000c', 1, 'c', 'published', '{"id":"00000000-0000-4000-8000-00000000000c","name":"C","status":"published"}');

INSERT INTO starter_decks (starter_deck_id, sort_name, status, total_count, metadata) VALUES
  ('00000000-0000-4000-8000-0000000000d1', '1', 'published', 5, '{"id":"00000000-0000-4000-8000-0000000000d1","name":"火","status":"published","cards":[{"card_id":"00000000-0000-4000-8000-00000000000a","count":4},{"card_id":"00000000-0000-4000-8000-00000000000b","count":1}]}'),
  ('00000000-0000-4000-8000-0000000000d2', '2', 'published', 7, '{"id":"00000000-0000-4000-8000-0000000000d2","name":"水","status":"published","cards":[{"card_id":"00000000-0000-4000-8000-00000000000a","count":2},{"card_id":"00000000-0000-4000-8000-00000000000b","count":3},{"card_id":"00000000-0000-4000-8000-00000000000c","count":2}]}');

-- 値は core の gamerules.Defaults()
INSERT INTO game_rules (game_rules_id, metadata) VALUES
  ('00000000-0000-4000-8000-0000000000e1', '{"id":"00000000-0000-4000-8000-0000000000e1","revision":1,"rules":{"player":{"max_decks":10,"max_avatars":5},"deck":{"total_card_count":40,"max_card_duplicates":4},"starter_deck":{"max_published":2}}}');

-- 公開中のボード 2 つ（名前の順に A・B）と、使用不可のボード 1 つ（一覧に出ないことを確かめる）。
-- metadata は studio の read model（readmodel.BoardMetadata）が書く形で、kind は小文字。sort_name は並びを決めるだけの値。
-- A は 2×1（拠点とチェックポイントがつながる）、B は 3×2（真ん中の土地が 3 方向につながる）
INSERT INTO boards (board_id, sort_name, status, metadata) VALUES
  ('00000000-0000-4000-8000-0000000000b1', '1', 'published', '{"id":"00000000-0000-4000-8000-0000000000b1","name":"公開中A","status":"published","width":2,"height":1,"tiles":[{"x":0,"y":0,"kind":"base"},{"x":1,"y":0,"kind":"checkpoint"}],"connections":[{"a":{"x":0,"y":0},"b":{"x":1,"y":0}}]}'),
  ('00000000-0000-4000-8000-0000000000b2', '2', 'published', '{"id":"00000000-0000-4000-8000-0000000000b2","name":"公開中B","status":"published","width":3,"height":2,"tiles":[{"x":0,"y":0,"kind":"base"},{"x":1,"y":0,"kind":"land"},{"x":2,"y":0,"kind":"checkpoint"},{"x":1,"y":1,"kind":"land"}],"connections":[{"a":{"x":0,"y":0},"b":{"x":1,"y":0}},{"a":{"x":1,"y":0},"b":{"x":1,"y":1}},{"a":{"x":1,"y":0},"b":{"x":2,"y":0}}]}'),
  ('00000000-0000-4000-8000-0000000000b3', '3', 'retired', '{"id":"00000000-0000-4000-8000-0000000000b3","name":"使用不可","status":"retired","width":2,"height":1,"tiles":[{"x":0,"y":0,"kind":"base"},{"x":1,"y":0,"kind":"checkpoint"}],"connections":[{"a":{"x":0,"y":0},"b":{"x":1,"y":0}}]}');
