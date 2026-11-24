# Бронирование столиков

Веб-приложение для бронирования столов (10 столов, одна бронь на стол и дату). Гости бронируют и отменяют столы на
главной странице, администратор после входа смотрит брони за выбранный период.

## Возможности

- **Гость** (`/`): схема зала со свободными и занятыми столами на выбранную дату, бронь по имени, фамилии и телефону
  (8 цифр), отмена брони по телефону и дате. Один человек не может занять два стола на одну дату.
- **Администратор** (`/admin-console`): вход по логину и паролю, выбор периода (левая дата не позже правой),
  брони по дням в раскрывающихся блоках с таблицей «стол - гость - телефон».
- Тексты ошибок приходят с сервера на русском и показываются у соответствующих полей.

## Технологии

| Часть | Что используется |
|---|---|
| Сервер | Java 25, встроенный Jetty 12 (без Spring Boot), Spring MVC 7, Spring Security 7 |
| Данные | Hibernate 7, Liquibase, Agroal; H2 в памяти для разработки, PostgreSQL для боевой базы |
| Фронтенд | React 19, TypeScript, react-router, axios, Sass; сборка Vite |
| Сборка и деплой | Maven, Docker (jlink-JRE на Alpine), docker compose, Caddy (HTTPS) |

## Быстрый старт

Нужны JDK 25, Maven и Node.js (для сборки фронтенда).

```bash
mvn compile exec:exec        # собирает фронтенд (npm ci, vite) и запускает сервер на http://localhost:8080
```

Без переменных окружения приложение работает на H2 в памяти и при старте заполняет базу тестовыми данными
(100 клиентов и брони примерно на 60% мест на 3 месяца вперёд). Консоль H2: <http://localhost:8080/h2-console>.

Вход администратора в режиме разработки: логин `admin`, пароль `admin`.

### Разработка фронтенда

```bash
mvn compile exec:exec        # сервер на :8080
npm run dev                  # Vite на http://localhost:5173, запросы /api/ проксируются на :8080
```

Другие команды: `npm run lint` (oxlint), `npm run build` (oxlint, проверка типов, сборка в
`src/main/resources/static`). Maven пропускает фронтенд при `-DskipFrontend`.

## Настройки (переменные окружения)

| Переменная | Назначение | По умолчанию |
|---|---|---|
| `PORT` | порт сервера | `8080` |
| `DB_URL` | JDBC-адрес базы, например `jdbc:postgresql://db:5432/club` | H2 в памяти |
| `DB_USER`, `DB_PASSWORD` | доступ к базе | `sa` и пустой пароль |
| `ADMIN_USER` | логин администратора | `admin` |
| `ADMIN_PASSWORD` | пароль администратора | `admin` на H2; **обязателен** на боевой базе, иначе сервер не стартует |

Пароль администратора хранится в памяти в виде bcrypt-хэша и сравнивается без утечки по времени ответа.

## API

Все пути начинаются с `/api/v1`. Ошибки приходят JSON: `{"поле": ["сообщение"]}` или `{"error": "текст"}`.

| Метод и путь | Описание | Доступ |
|---|---|---|
| `GET /reservations?date=2026-11-20` | номера занятых столов на дату (по умолчанию сегодня) | все |
| `POST /reservations` | создать бронь (`tableNumber`, `date`, `phone`, `firstName`, `lastName`) | все |
| `DELETE /reservations/{phone}/{date}` | отменить бронь клиента на дату | все |
| `GET /admin/reservations?start=…&end=…` | брони за период включительно, сгруппированные по дате | администратор |
| `POST /login` | вход, форма `x-www-form-urlencoded` (`username`, `password`), ответ с cookie `JSESSIONID` | все |
| `POST /logout` | выход | все |

Открытие адреса `/api/v1/...` прямо в адресной строке браузера перенаправляет на главную (`RedirectFilter`).
Запросы самого приложения при этом не затрагиваются.

## Сборка и запуск jar

```bash
mvn package                  # target/app.jar и target/lib/ (зависимости)
java -jar target/app.jar     # библиотеки подхватываются из lib/ по Class-Path в манифесте
```

`app.jar` нужно держать рядом с каталогом `lib/`.

## Деплой через Docker

Многоступенчатый `Dockerfile`: Vite собирает фронтенд, Maven собирает `app.jar` и `lib/`, `jdeps` и `jlink`
делают урезанный JRE, итоговый образ на Alpine запускается не от root.

1. Создайте рядом с `docker-compose.yml` файл `.env` (в git он не попадает):

   ```
   DOMAIN=book.example.com
   DB_PASSWORD=длинный-случайный-пароль
   ADMIN_PASSWORD=другой-длинный-пароль
   ```

2. Запустите:

   ```bash
   docker compose up -d --build
   ```

Поднимаются три сервиса: PostgreSQL 17, приложение (порт 8080 наружу не публикуется) и Caddy, который выпускает
сертификат Let's Encrypt и проксирует трафик на приложение. Домен должен указывать на сервер, порты 80 и 443 открыты.

## Структура проекта

```
src/main/java/krilovs/andrejs/reservation/
  Main.java              запуск Jetty, Spring и сервлетов
  config/                настройки: AppConfig, SecurityConfig, MainServlet (SPA), RedirectFilter,
                         ApiExceptionHandler, DevDataSeeder
  reservation/           публичное API бронирования
  admin/                 API администратора
  model/                 сущности базы
src/main/resources/db/   миграции Liquibase
src/main/react/          фронтенд
  App.tsx                маршруты: /, /admin-console, остальное на главную
  reservation/           страница гостя (бронь и отмена)
  admin/                 страница администратора (вход, период, таблица броней)
  components/            DatePicker, TableGrid, Field
  styles/, *.scss        общие стили и стили компонентов рядом с ними
```

Как это устроено:

- `MainServlet` отдаёт файлы фронтенда, а на любой путь без файла (например `/admin-console` при обновлении страницы)
  отвечает `index.html`, дальше маршрут выбирает react-router.
- Страница администратора открывается без входа и сама показывает окно входа, если сервер ответил 401. Данные
  защищены на `/api/v1/admin/**`.
- Миграции Liquibase создают таблицы при старте; на номер стола в таблице броней есть ограничение (1-10).


Set up this app on Neon.
1. `npm i -g neon@latest`. If that fails, use `npx neon@latest` in place of `neon`.
   If a neon command opens a browser sign-in, tell me to finish it there. If that times out or fails, ask me to run `neon login`, then retry.
2. In the project root:
   neon init -y --org-id org-blue-term-64904826 --project-id young-smoke-00620592 --branch production --services postgres
3. `neon deploy`. It provisions the services in neon.ts and pulls their env vars into `.env.local` (or `.env` if it exists).
4. Wire each service into the app's code using those env vars. Consult the installed Neon agent skills for best practices, e.g., what database driver to use given the app architecture and hosting runtime.
5. Prove it works: `npm run build` must pass, then start the app, each wired service must be tested to prove it works end to end.
6. Report what changed, the command output that proves step 5, and anything that failed.
   ep-young-firefly-bgxzz0sc