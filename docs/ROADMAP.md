# Следующие изменения LSPTube

Зафиксировано по запросу пользователя 2026-11-02. Эти задачи не входят в текущее исправление заиканий перевода.

1. **Экран запуска:** название LSPTube и линия загрузки. Обычные сообщения запуска скрыты от пользователя, техническое состояние остаётся в диагностике. При ошибке — понятное описание причины.
2. **Повторный запуск:** если служба/Engine уже работают, сразу вывести плеер на передний план. Убрать необходимость нажимать кнопку открытия после сообщения «уже запущено».
3. **Единое приложение:** исследовать и реализовать единый запуск/установку, при необходимости переработав архитектуру. Ранее веб-оболочка открывала настольный YouTube; не повторять её как готовое решение. Рабочая двухкомпонентная версия остаётся доступной до проверки замены на Freestyle с TV-интерфейсом, переводом, перемоткой и громкостью.


### Native AAC preview follow-up

- Hardware baseline: user confirmed moving picture + steady single-player test tone in 0.7.2 (44100 Hz stereo, 15.09 seconds, 9 packets / 3870 AAC frames).
- Validate 0.8.0 actual translated audio, same-video reload, stop/restoration, seeking, pause/resume, long playback and preparation performance on Freestyle.
- Add original/translation mixing and live balance to AAC only after this native path is confirmed; PCM already retains the working balance. Native preview currently bakes voice gain during preparation and removes the original.
- Expand native configuration matching beyond 44100/stereo, and progressive preparation for long/partial translations if hardware preparation time demands it.
