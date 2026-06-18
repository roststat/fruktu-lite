export const metadata = {
  title: "Политика использования cookie — Схожу на рынок",
};

export default function CookiesPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-extrabold">
        Политика использования файлов cookie
      </h1>
      <p className="mb-8 text-sm text-muted">
        Действует в отношении сервиса «Схожу на рынок» (сайт fruktu.ru).
        Обновлено: 15.06.2026
      </p>

      <div className="flex flex-col gap-6 text-sm leading-relaxed">
        <section>
          <h2 className="mb-2 text-lg font-bold">1. Что такое cookie</h2>
          <p>
            Cookie — это небольшие текстовые файлы, которые сохраняются в
            браузере при посещении сайта. Они помогают сайту запоминать
            настройки и действия пользователя.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold">2. Какие данные мы храним</h2>
          <p>
            Для работы Сайта используется локальное хранилище браузера
            (localStorage), в котором сохраняется состав вашего списка
            покупок — это позволяет не терять список при обновлении
            страницы или повторном визите. Эти данные хранятся локально
            на вашем устройстве и не передаются на сервер автоматически.
          </p>
          <p className="mt-2">
            Сайт может использовать технически необходимые cookie для
            корректной работы страниц и, при подключении сервисов
            аналитики, — статистические cookie для оценки посещаемости.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold">3. Как управлять cookie</h2>
          <p>
            Вы можете в любой момент очистить cookie и локальное хранилище
            в настройках своего браузера. Обратите внимание, что очистка
            локального хранилища приведёт к удалению сохранённого списка
            покупок.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold">4. Согласие</h2>
          <p>
            Продолжая использовать Сайт, вы соглашаетесь с использованием
            cookie и локального хранилища браузера в указанных целях.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold">5. Контакты</h2>
          <p>
            По вопросам использования cookie можно обратиться по телефону{" "}
            <a href="tel:+79790474734" className="font-semibold text-primary-dark">
              +7 979 047-47-34
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
