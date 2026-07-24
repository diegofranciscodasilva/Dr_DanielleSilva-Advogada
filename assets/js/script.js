/* =============================================
   DR DANIELLE SILVA ADVOCACIA — script.js
   Mobile First · WCAG 2.2 AA
============================================= */

'use strict';

/* Utilitários */
const qs = (s, ctx = document) => ctx.querySelector(s);
const qsa = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));

/* Feature detection */
const suporta = {
    localStorage: (() => { try { localStorage.setItem('_t', '1'); localStorage.removeItem('_t'); return true; } catch (e) { return false; } })(),
    intersectionObserver: typeof IntersectionObserver !== 'undefined',
    matchMedia: typeof window.matchMedia === 'function',
};

/* Debounce */
function debounce(fn, ms = 100) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

/* =============================================
   1. PRELOADER
============================================= */
(function initPreloader() {
    const el = qs('#preloader');
    if (!el) return;
    const esconder = () => {
        el.classList.add('is-oculto');
        setTimeout(() => { el.hidden = true; }, 600);
    };
    if (document.readyState === 'complete') { esconder(); }
    else { window.addEventListener('load', esconder); }
    setTimeout(esconder, 5000); // fallback
})();

/* =============================================
   2. COOKIE BANNER — LGPD (CORRIGIDO)
   Problema anterior: display:flex no CSS
   sobrescrevia o atributo hidden do HTML.
   Solução: usar classList + visibility/display
   via classe .is-oculto em vez de hidden.
============================================= */
(function initCookieBanner() {
    try {
        const banner = qs('#cookie-banner');
        const aceitar = qs('#cookie-accept');
        const recusar = qs('#cookie-reject');

        if (!banner) return;

        /* Verifica se o usuário já respondeu antes */
        const jaRespondeu = suporta.localStorage
            ? localStorage.getItem('cookie-consent')
            : false;

        if (!jaRespondeu) {
            /* Exibe o banner removendo o hidden */
            banner.removeAttribute('hidden');

            /* Pequeno delay para não bloquear renderização inicial */
            setTimeout(() => {
                aceitar?.focus();
            }, 800);
        }

        /* Função que fecha o banner corretamente */
        function fecharBanner(valor) {
            /* 1. Adiciona classe de saída (opcional — animação) */
            banner.classList.add('cookie-banner--saindo');

            /* 2. Após a transição, oculta de verdade */
            setTimeout(() => {
                banner.setAttribute('hidden', '');
                banner.classList.remove('cookie-banner--saindo');
            }, 350);

            /* 3. Persiste a escolha no localStorage */
            if (suporta.localStorage) {
                localStorage.setItem('cookie-consent', valor);
            }
        }

        /* Eventos dos botões */
        aceitar?.addEventListener('click', () => fecharBanner('accepted'));
        recusar?.addEventListener('click', () => fecharBanner('rejected'));

        /* Fecha com ESC — acessibilidade */
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !banner.hasAttribute('hidden')) {
                fecharBanner('rejected');
            }
        });

    } catch (e) {
        console.error('[CookieBanner]', e);
    }
})();

/* =============================================
   3. TOAST
============================================= */
let _toastTimer = null;

function exibirToast(msg, tipo = 'sucesso', duracao = 4500) {
    try {
        const toast = qs('#toast');
        const toastMsg = qs('#toast-msg');
        if (!toast || !toastMsg) return;
        toastMsg.textContent = msg;
        toast.className = `toast toast--${tipo}`;
        toast.hidden = false;
        toast.removeAttribute('hidden');
        clearTimeout(_toastTimer);
        _toastTimer = setTimeout(ocultarToast, duracao);
    } catch (e) { console.error('[Toast]', e); }
}

function ocultarToast() {
    try {
        const toast = qs('#toast');
        if (toast) toast.hidden = true;
        clearTimeout(_toastTimer);
    } catch (e) { console.error('[OcultarToast]', e); }
}
window.ocultarToast = ocultarToast;

/* =============================================
   4. TEMA CLARO / ESCURO
============================================= */
(function initTema() {
    try {
        const btn = qs('#theme-toggle');
        const icone = qs('#theme-icon');
        const html = document.documentElement;

        /* Detecta preferência inicial */
        function temaInicial() {
            if (suporta.localStorage) {
                const salvo = localStorage.getItem('tema');
                if (salvo) return salvo;
            }
            if (suporta.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return 'dark';
            }
            return 'light';
        }

        function aplicarTema(tema) {
            html.setAttribute('data-theme', tema);
            if (icone) {
                icone.className = tema === 'dark' ? 'ri-sun-line' : 'ri-moon-line';
            }
            if (btn) {
                btn.setAttribute('aria-label', tema === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro');
            }
            if (suporta.localStorage) localStorage.setItem('tema', tema);
        }

        aplicarTema(temaInicial());

        btn?.addEventListener('click', () => {
            const atual = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            aplicarTema(atual);
        });

        /* Sincroniza mudança de preferência do sistema */
        if (suporta.matchMedia) {
            try {
                window.matchMedia('(prefers-color-scheme: dark)')
                    .addEventListener('change', (e) => {
                        if (!suporta.localStorage || !localStorage.getItem('tema')) {
                            aplicarTema(e.matches ? 'dark' : 'light');
                        }
                    });
            } catch (_) { }
        }
    } catch (e) { console.error('[Tema]', e); }
})();

/* =============================================
   5. NAVBAR — scroll, active link, hamburger
============================================= */
(function initNavbar() {
    try {
        const navbar = qs('#navbar');
        const hamburger = qs('#hamburger');
        const mobileMenu = qs('#mobile-menu');
        const links = qsa('.navbar__link');
        if (!navbar) return;

        const secoes = ['hero', 'sobre', 'servicos', 'depoimentos', 'galeria', 'agendamento', 'contato'];

        /* Active link + sombra ao rolar */
        const onScroll = debounce(() => {
            navbar.classList.toggle('is-scrolled', window.scrollY > 50);
            const navH = navbar.offsetHeight;
            let secaoAtual = '';
            secoes.forEach(id => {
                const el = qs('#' + id);
                if (el && window.scrollY >= el.offsetTop - navH - 20) secaoAtual = id;
            });
            links.forEach(a => {
                const ativo = a.getAttribute('href') === '#' + secaoAtual;
                a.classList.toggle('is-active', ativo);
                ativo ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
            });
        }, 80);
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        /* Hamburger */
        function abrirMenu() {
            if (!mobileMenu || !hamburger) return;
            mobileMenu.hidden = false;
            hamburger.setAttribute('aria-expanded', 'true');
            hamburger.setAttribute('aria-label', 'Fechar menu');
            qs('.mobile-menu__link', mobileMenu)?.focus();
        }
        function fecharMenu() {
            if (!mobileMenu || !hamburger) return;
            mobileMenu.hidden = true;
            hamburger.setAttribute('aria-expanded', 'false');
            hamburger.setAttribute('aria-label', 'Abrir menu');
        }
        hamburger?.addEventListener('click', () => mobileMenu?.hidden ? abrirMenu() : fecharMenu());
        qsa('.mobile-menu__link').forEach(l => l.addEventListener('click', fecharMenu));
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && mobileMenu && !mobileMenu.hidden) {
                fecharMenu(); hamburger?.focus();
            }
        });
        document.addEventListener('click', e => {
            if (mobileMenu && !mobileMenu.hidden &&
                !mobileMenu.contains(e.target) && !hamburger?.contains(e.target)) fecharMenu();
        });

        /* Fecha em telas ≥768px */
        if (suporta.matchMedia) {
            const mq = window.matchMedia('(min-width:768px)');
            const onResize = (e) => { if (e.matches) fecharMenu(); };
            try { mq.addEventListener('change', onResize); }
            catch (_) { mq.addListener(onResize); }
        }
    } catch (e) { console.error('[Navbar]', e); }
})();

/* =============================================
   6. LIGHTBOX — GALERIA
============================================= */
let _ultimoFoco = null;

function abrirLightbox(src, alt) {
    try {
        const lb = qs('#lightbox');
        const img = qs('#lightbox-img');
        const legenda = qs('#lightbox-legenda');
        if (!lb) return;
        _ultimoFoco = document.activeElement;
        img.src = src;
        img.alt = alt;
        if (legenda) legenda.textContent = alt;
        lb.hidden = false;
        document.body.style.overflow = 'hidden';
        qs('.lightbox__fechar', lb)?.focus();
    } catch (e) { console.error('[Lightbox abrir]', e); }
}

function fecharLightbox() {
    try {
        const lb = qs('#lightbox');
        const img = qs('#lightbox-img');
        if (!lb) return;
        lb.hidden = true;
        if (img) img.src = '';
        document.body.style.overflow = '';
        _ultimoFoco?.focus();
    } catch (e) { console.error('[Lightbox fechar]', e); }
}

document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && qs('#lightbox') && !qs('#lightbox').hidden) fecharLightbox();
});

/* Trap de foco no lightbox */
qs('#lightbox')?.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const lb = qs('#lightbox');
    const focaveis = qsa('button,[href],[tabindex]:not([tabindex="-1"])', lb);
    if (!focaveis.length) return;
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    if (e.shiftKey) { if (document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); } }
    else { if (document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); } }
});

window.abrirLightbox = abrirLightbox;
window.fecharLightbox = fecharLightbox;

/* =============================================
   7. CARROSSEL DE DEPOIMENTOS
============================================= */
(function initCarrossel() {
    try {
        const trilha = qs('#carrossel-trilha');
        if (!trilha) return;
        const slides = qsa('.carrossel__slide', trilha);
        const pontosWrap = qs('#carrossel-pontos');
        const DURACAO = 5500;
        let atual = 0, timer = null;
        const total = slides.length;
        if (total === 0) return;

        /* Cria dots */
        slides.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.className = 'carrossel__ponto' + (i === 0 ? ' is-active' : '');
            dot.setAttribute('role', 'tab');
            dot.setAttribute('aria-label', `Depoimento ${i + 1} de ${total}`);
            dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
            dot.addEventListener('click', () => { irPara(i); reiniciarTimer(); });
            pontosWrap?.appendChild(dot);
        });
        const dots = qsa('.carrossel__ponto', pontosWrap);

        function irPara(idx) {
            atual = ((idx % total) + total) % total;
            trilha.style.transform = `translateX(-${atual * 100}%)`;
            slides.forEach((sl, i) => {
                const ativo = i === atual;
                sl.setAttribute('aria-current', ativo ? 'true' : 'false');
                sl.setAttribute('aria-hidden', ativo ? 'false' : 'true');
            });
            dots.forEach((d, i) => {
                const ativo = i === atual;
                d.classList.toggle('is-active', ativo);
                d.setAttribute('aria-selected', String(ativo));
            });
        }

        function moverSlide(dir) { irPara(atual + dir); reiniciarTimer(); }
        window.moverSlide = moverSlide;

        function iniciarTimer() { timer = setInterval(() => irPara(atual + 1), DURACAO); }
        function pararTimer() { clearInterval(timer); timer = null; }
        function reiniciarTimer() { pararTimer(); iniciarTimer(); }

        const reduzido = suporta.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!reduzido) iniciarTimer();

        const carrossel = qs('#carrossel');
        carrossel?.addEventListener('mouseenter', pararTimer);
        carrossel?.addEventListener('mouseleave', () => { if (!reduzido) iniciarTimer(); });
        carrossel?.addEventListener('focusin', pararTimer);
        carrossel?.addEventListener('focusout', () => { if (!reduzido) iniciarTimer(); });
        carrossel?.addEventListener('keydown', e => {
            if (e.key === 'ArrowLeft') moverSlide(-1);
            if (e.key === 'ArrowRight') moverSlide(1);
        });

        irPara(0);
    } catch (e) { console.error('[Carrossel]', e); }
})();

/* =============================================
   8. FORMULÁRIO DE AGENDAMENTO
============================================= */
(function initFormAgendamento() {
    try {
        const form = qs('#form-agendamento');
        if (!form) return;

        /* Data mínima = hoje */
        const inputData = qs('#ag-data');
        if (inputData) {
            inputData.min = new Date().toISOString().split('T')[0];
        }

        function validarCampo(id, erroId) {
            const campo = qs('#' + id);
            const erroEl = qs('#' + erroId);
            if (!campo || !erroEl) return true;
            let msg = '';
            if (campo.validity.valueMissing) msg = 'Campo obrigatório.';
            else if (campo.validity.patternMismatch) msg = campo.dataset.erroPattern || 'Formato inválido.';
            else if (campo.validity.typeMismatch) msg = 'Valor inválido.';
            else if (campo.type === 'date') {
                const sel = new Date(campo.value + 'T00:00');
                const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
                if (sel < hoje) msg = 'Escolha uma data futura.';
            }
            erroEl.textContent = msg;
            campo.classList.toggle('is-invalid', !!msg);
            campo.classList.toggle('is-valid', !msg && campo.value !== '');
            return !msg;
        }

        /* Validação ao perder foco */
        const mapaErros = {
            'ag-nome': 'ag-nome-erro', 'ag-telefone': 'ag-tel-erro', 'ag-data': 'ag-data-erro'
        };
        Object.entries(mapaErros).forEach(([id, erroId]) => {
            qs('#' + id)?.addEventListener('blur', () => validarCampo(id, erroId));
        });

        form.addEventListener('submit', e => {
            e.preventDefault();
            try {
                let valido = true;
                Object.entries(mapaErros).forEach(([id, erroId]) => {
                    if (!validarCampo(id, erroId)) valido = false;
                });
                ['ag-horario', 'ag-area'].forEach(id => {
                    const sel = qs('#' + id);
                    const err = qs('#' + id + '-erro');
                    if (sel && !sel.value) {
                        valido = false; sel.classList.add('is-invalid');
                        if (err) err.textContent = 'Selecione uma opção.';
                    }
                });
                if (!valido) {
                    exibirToast('⚠️ Preencha todos os campos obrigatórios.', 'erro');
                    qs('.is-invalid', form)?.focus();
                    return;
                }

                const dados = {
                    nome: qs('#ag-nome')?.value.trim(),
                    tel: qs('#ag-telefone')?.value.trim(),
                    email: qs('#ag-email')?.value.trim(),
                    data: qs('#ag-data')?.value,
                    horario: qs('#ag-horario')?.value,
                    area: qs('#ag-area')?.value,
                    msg: qs('#ag-mensagem')?.value.trim(),
                };

                const texto = [
                    '⚖️ *Solicitação de Consulta — DR Danielle Silva Advocacia*', '',
                    `*Nome:* ${dados.nome}`,
                    `*WhatsApp:* ${dados.tel}`,
                    dados.email ? `*E-mail:* ${dados.email}` : null,
                    `*Data:* ${dados.data} às ${dados.horario}`,
                    `*Área:* ${dados.area}`,
                    dados.msg ? `*Situação:* ${dados.msg}` : null,
                ].filter(Boolean).join('\n');

                /* Número da Dra. Danielle */
                window.open(
                    `https://wa.me/5511997285288?text=${encodeURIComponent(texto)}`,
                    '_blank', 'noopener,noreferrer'
                );

                /* BACKEND REAL (descomentar):
                fetch('/api/agendamento', {
                  method:'POST',
                  headers:{'Content-Type':'application/json'},
                  body:JSON.stringify(dados)
                }); */

                exibirToast('✅ Solicitação enviada! A Dra. Danielle entrará em contato em breve.', 'sucesso');
                form.reset();
                qsa('.is-valid,.is-invalid', form).forEach(el => el.classList.remove('is-valid', 'is-invalid'));
            } catch (err) {
                console.error('[FormAgendamento submit]', err);
                exibirToast('Erro ao enviar. Tente novamente.', 'erro');
            }
        });
    } catch (e) { console.error('[FormAgendamento]', e); }
})();

/* =============================================
   9. NEWSLETTER
============================================= */
(function initNewsletter() {
    try {
        const form = qs('#form-newsletter');
        if (!form) return;
        form.addEventListener('submit', e => {
            e.preventDefault();
            try {
                const input = qs('#nl-email');
                const erro = qs('#nl-erro');
                if (!input?.value || !input.validity.valid) {
                    input?.classList.add('is-invalid');
                    if (erro) erro.textContent = 'Informe um e-mail válido.';
                    input?.focus(); return;
                }
                if (erro) erro.textContent = '';
                input.classList.remove('is-invalid'); input.classList.add('is-valid');
                /* BACKEND: fetch('/api/newsletter',{method:'POST',body:JSON.stringify({email:input.value})}) */
                exibirToast('📧 Inscrito com sucesso! Bem-vindo(a) aos conteúdos jurídicos.', 'sucesso');
                form.reset(); input.classList.remove('is-valid');
            } catch (err) {
                console.error('[Newsletter submit]', err);
                exibirToast('Erro ao assinar. Tente novamente.', 'erro');
            }
        });
    } catch (e) { console.error('[Newsletter]', e); }
})();

/* =============================================
   10. BOTÃO VOLTAR AO TOPO (CORRIGIDO)
   Problema anterior: main.focus() sem
   preventScroll:true fazia o browser rolar
   novamente para o elemento, interrompendo
   o scrollTo({ top:0 }) no meio do caminho.
============================================= */
(function initBtnTopo() {
    try {
        const btn = qs('#btn-topo');
        if (!btn) return;

        /* Mostra/oculta o botão conforme a posição do scroll */
        const onScroll = debounce(() => {
            const visivel = window.scrollY > 400;
            btn.hidden = false;
            btn.classList.toggle('is-visivel', visivel);
            btn.setAttribute('aria-hidden', String(!visivel));
        }, 100);

        window.addEventListener('scroll', onScroll, { passive: true });

        /* Ao clicar, rola ao topo e só move o foco DEPOIS que o scroll termina */
        btn.addEventListener('click', () => {

            /* 1. Rola suavemente até o topo */
            window.scrollTo({ top: 0, behavior: 'smooth' });

            /* 2. Aguarda o scroll terminar (~600ms) antes de mover o foco.
                  preventScroll:true impede o browser de rolar de volta
                  ao tentar exibir o elemento focado — era o bug. */
            setTimeout(() => {
                const main = qs('#conteudo-principal');
                if (main) {
                    main.setAttribute('tabindex', '-1');

                    /* preventScroll:true = foca sem acionar rolagem automática */
                    main.focus({ preventScroll: true });
                }
            }, 650);

        });

    } catch (e) {
        console.error('[BtnTopo]', e);
    }
})();

/* =============================================
   11. SCROLL REVEAL — IntersectionObserver
============================================= */
(function initScrollReveal() {
    const reduzido = suporta.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!suporta.intersectionObserver || reduzido) {
        qsa('.reveal-cima,.reveal-esquerda,.reveal-direita').forEach(el =>
            el.classList.add('is-visivel')
        );
        return;
    }
    try {
        const obs = new IntersectionObserver((entries) => {
            entries.forEach((entry, i) => {
                if (!entry.isIntersecting) return;
                setTimeout(() => entry.target.classList.add('is-visivel'), i * 60);
                obs.unobserve(entry.target);
            });
        }, { threshold: 0.12 });

        qsa('.reveal-cima,.reveal-esquerda,.reveal-direita').forEach(el => obs.observe(el));
        qsa('.card-servico,.card-depoimento,.galeria__item').forEach(el => {
            el.classList.add('reveal-cima'); obs.observe(el);
        });
    } catch (e) {
        console.error('[ScrollReveal]', e);
        qsa('.reveal-cima,.reveal-esquerda,.reveal-direita').forEach(el =>
            el.classList.add('is-visivel')
        );
    }
})();

/* =============================================
   12. ANIMAÇÃO HERO — entrada em cascata
============================================= */
(function initHeroAnimation() {
    const reduzido = suporta.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduzido) return;
    try {
        const els = ['.hero__eyebrow', '.hero__titulo', '.hero__desc', '.hero__acoes', '.hero__numeros'];
        els.forEach((sel, i) => {
            const el = qs(sel);
            if (!el) return;
            el.style.opacity = '0';
            el.style.transform = 'translateY(28px)';
            el.style.transition = `opacity .7s ease ${i * .15}s, transform .7s ease ${i * .15}s`;
        });
        requestAnimationFrame(() => requestAnimationFrame(() => {
            els.forEach(sel => {
                const el = qs(sel);
                if (!el) return;
                el.style.opacity = '1'; el.style.transform = 'translateY(0)';
            });
        }));
    } catch (e) { console.error('[HeroAnimation]', e); }
})();

/* =============================================
   13. SMOOTH SCROLL
============================================= */
document.addEventListener('click', e => {
    try {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;
        const href = link.getAttribute('href');
        if (!href || href === '#' || href === '#!') return;
        const alvo = qs(href);
        if (!alvo) return;
        e.preventDefault();
        const navH = qs('#navbar')?.offsetHeight || 0;
        window.scrollTo({ top: alvo.getBoundingClientRect().top + window.scrollY - navH - 8, behavior: 'smooth' });
        history.pushState(null, '', href);
    } catch (e) { console.error('[SmoothScroll]', e); }
});

/* =============================================
   14. ANO NO FOOTER
============================================= */
(function () {
    const el = qs('#footer-ano');
    if (el) el.textContent = new Date().getFullYear();
})();
