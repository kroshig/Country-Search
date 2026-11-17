export class CountrySearchView {
    inputEl;
    historyContainer;
    statusContainer;
    resultsContainer;
    detailsContainer;
    callbacks;
    constructor(root, callbacks) {
        this.callbacks = callbacks;
        const app = document.createElement('main');
        app.className = 'app-container';
        const header = document.createElement('header');
        header.className = 'app-header';
        const title = document.createElement('h1');
        title.textContent = 'Country Search';
        const searchBox = document.createElement('div');
        searchBox.className = 'search-box';
        this.inputEl = document.createElement('input');
        this.inputEl.type = 'search';
        this.inputEl.placeholder = 'Введите название страны (например, Spain)...';
        this.inputEl.className = 'search-input';
        this.inputEl.setAttribute('aria-label', 'Поиск страны по названию');
        this.inputEl.addEventListener('input', () => {
            this.callbacks.onInputChange(this.inputEl.value);
        });
        searchBox.append(this.inputEl);
        this.historyContainer = document.createElement('div');
        this.historyContainer.className = 'history-bar';
        header.append(title, searchBox, this.historyContainer);
        this.statusContainer = document.createElement('div');
        this.statusContainer.className = 'status-container';
        const contentLayout = document.createElement('div');
        contentLayout.className = 'content-layout';
        this.resultsContainer = document.createElement('section');
        this.resultsContainer.className = 'results-grid';
        this.detailsContainer = document.createElement('aside');
        this.detailsContainer.className = 'details-panel hidden';
        contentLayout.append(this.resultsContainer, this.detailsContainer);
        app.append(header, this.statusContainer, contentLayout);
        root.append(app);
    }
    setInputValue(query) {
        this.inputEl.value = query;
    }
    renderHistory(queries) {
        this.historyContainer.replaceChildren();
        if (queries.length === 0)
            return;
        const label = document.createElement('span');
        label.className = 'history-label';
        label.textContent = 'Недавние:';
        this.historyContainer.append(label);
        queries.forEach((query) => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'history-chip';
            chip.textContent = query;
            chip.addEventListener('click', () => {
                this.setInputValue(query);
                this.callbacks.onSelectHistory(query);
            });
            this.historyContainer.append(chip);
        });
    }
    renderState(state) {
        this.statusContainer.replaceChildren();
        this.resultsContainer.replaceChildren();
        this.hideDetails();
        switch (state.status) {
            case 'idle':
                break;
            case 'loading': {
                const loader = document.createElement('div');
                loader.className = 'loading-indicator';
                loader.setAttribute('role', 'status');
                loader.textContent = `Поиск «${state.query}»...`;
                this.statusContainer.append(loader);
                break;
            }
            case 'empty': {
                const emptyBox = document.createElement('div');
                emptyBox.className = 'empty-state';
                emptyBox.textContent = `По запросу «${state.query}» ничего не найдено.`;
                this.statusContainer.append(emptyBox);
                break;
            }
            case 'error': {
                const errorBox = document.createElement('div');
                errorBox.className = 'error-state';
                errorBox.setAttribute('role', 'alert');
                const msg = document.createElement('p');
                msg.className = 'error-message';
                msg.textContent = state.message;
                const retryBtn = document.createElement('button');
                retryBtn.type = 'button';
                retryBtn.className = 'retry-button';
                retryBtn.textContent = 'Повторить';
                retryBtn.addEventListener('click', () => {
                    this.callbacks.onRetry();
                });
                errorBox.append(msg, retryBtn);
                this.statusContainer.append(errorBox);
                break;
            }
            case 'success': {
                state.countries.forEach((country) => {
                    const card = this.createCountryCard(country);
                    this.resultsContainer.append(card);
                });
                break;
            }
        }
    }
    createCountryCard(country) {
        const article = document.createElement('article');
        article.className = 'country-card';
        article.tabIndex = 0;
        if (country.flagUrl) {
            const img = document.createElement('img');
            img.src = country.flagUrl;
            img.alt = `Флаг ${country.name}`;
            img.className = 'country-flag';
            img.loading = 'lazy';
            article.append(img);
        }
        else {
            const emoji = document.createElement('div');
            emoji.className = 'country-flag-emoji';
            emoji.textContent = country.flagEmoji;
            article.append(emoji);
        }
        const body = document.createElement('div');
        body.className = 'card-body';
        const title = document.createElement('h2');
        title.className = 'country-name';
        title.textContent = country.name;
        const capital = this.createMetaRow('Столица', country.capital);
        const region = this.createMetaRow('Регион', country.region);
        const population = this.createMetaRow('Население', country.population.toLocaleString('ru-RU'));
        body.append(title, capital, region, population);
        article.append(body);
        const openDetails = () => this.renderDetails(country);
        article.addEventListener('click', openDetails);
        article.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openDetails();
            }
        });
        return article;
    }
    renderDetails(country) {
        this.detailsContainer.replaceChildren();
        this.detailsContainer.classList.remove('hidden');
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'close-details-button';
        closeBtn.textContent = 'Закрыть';
        closeBtn.addEventListener('click', () => this.hideDetails());
        const title = document.createElement('h2');
        title.textContent = `${country.flagEmoji} ${country.officialName}`;
        const desc = document.createElement('p');
        desc.className = 'country-description';
        desc.textContent = country.description;
        const area = this.createMetaRow('Площадь', `${country.area.toLocaleString('ru-RU')} км²`);
        const languages = this.createMetaRow('Языки', country.languages.length > 0 ? country.languages.join(', ') : 'Нет данных');
        const currencies = this.createMetaRow('Валюта', country.currencies.length > 0 ? country.currencies.join(', ') : 'Нет данных');
        const borders = this.createMetaRow('Границы', country.borders.length > 0 ? country.borders.join(', ') : 'Нет сухопутных границ');
        this.detailsContainer.append(closeBtn, title, desc, area, languages, currencies, borders);
    }
    hideDetails() {
        this.detailsContainer.replaceChildren();
        this.detailsContainer.classList.add('hidden');
    }
    createMetaRow(label, value) {
        const p = document.createElement('p');
        p.className = 'meta-row';
        const strong = document.createElement('strong');
        strong.textContent = `${label}: `;
        const span = document.createElement('span');
        span.textContent = value;
        p.append(strong, span);
        return p;
    }
}
