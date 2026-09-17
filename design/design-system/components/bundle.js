/* @ds-bundle: {"format":4,"namespace":"LureCapital","components":[{"name":"Logo"},{"name":"AppBar"},{"name":"SideNav"},{"name":"Footer"},{"name":"Button"},{"name":"StatusChip"},{"name":"Field"},{"name":"DataTable"},{"name":"Dialog"},{"name":"EmptyState"},{"name":"LoadingSkeleton"},{"name":"NoticeCard"}]} */
(function (global) {
  "use strict";
  var React = global.React;
  var h = React.createElement;

  function cx() {
    var out = [];
    for (var i = 0; i < arguments.length; i++) if (arguments[i]) out.push(arguments[i]);
    return out.join(" ");
  }

  /* ------------------------------------------------------------------
     Symbol — o "+" de 5 blocos. Braços nunca coloridos; miolo amarelo.
     viewBox 48x48, blocos com rx 1.5 — geometria de design/assets/symbol.svg.
     ------------------------------------------------------------------ */
  var ARMS = [
    { x: 18.5, y: 3,    w: 11,   hh: 12.5 },
    { x: 18.5, y: 32.5, w: 11,   hh: 12.5 },
    { x: 3,    y: 18.5, w: 12.5, hh: 11 },
    { x: 32.5, y: 18.5, w: 12.5, hh: 11 }
  ];

  function Symbol_(props) {
    var p = props || {};
    var size = p.size || 34;
    var tone = p.tone || "ink";
    var arm = tone === "white" ? "var(--neutral-0)" : "var(--neutral-900)";
    var core = tone === "mono" ? arm : "var(--accent)";
    return h(
      "svg",
      {
        width: size, height: size, viewBox: "0 0 48 48", fill: "none",
        "aria-hidden": p.title ? undefined : "true",
        role: p.title ? "img" : undefined,
        style: { flex: "none", display: "block" }
      },
      p.title ? h("title", null, p.title) : null,
      ARMS.map(function (r, i) {
        return h("rect", { key: i, x: r.x, y: r.y, width: r.w, height: r.hh, rx: 1.5, fill: arm });
      }),
      h("rect", { x: 18.5, y: 18.5, width: 11, height: 11, rx: 1.5, fill: core })
    );
  }

  /* ------------------------------------------------------------------ Logo */
  function Logo(props) {
    var p = props || {};
    var size = p.size || 34;
    var nameSize = p.nameSize || 22;
    var tone = p.tone || "ink";
    var onDark = tone === "white";
    var chip = p.chip === undefined ? "CRM" : p.chip;
    var label = p.label || ("Lure" + (chip ? " " + chip : ""));
    var Tag = p.href ? "a" : "span";
    return h(
      Tag,
      { className: cx("lc-logo", p.className), href: p.href, "aria-label": label },
      h(Symbol_, { size: size, tone: tone }),
      p.wordmark === false ? null : h(
        "span", { className: cx("lc-logo__wm", p.stacked ? "lc-logo__wm--stacked" : null) },
        h("span", {
          className: "lc-logo__name",
          style: { fontSize: nameSize + "px", color: onDark ? "var(--neutral-0)" : "var(--text)" }
        }, "LURE"),
        chip ? h("span", {
          className: p.stacked ? "lc-logo__sub" : "lc-logo__chip",
          style: p.stacked
            ? { color: onDark ? "var(--neutral-0)" : "var(--text)" }
            : (onDark
                ? { background: "var(--neutral-0)", color: "var(--neutral-900)" }
                : { background: "var(--text)", color: "var(--text-inverse)" })
        }, chip) : null
      )
    );
  }

  /* ---------------------------------------------------------------- Button */
  function Button(props) {
    var p = props || {};
    var variant = p.variant || "primary";
    var size = p.size || "md";
    var rest = {};
    for (var k in p) if (["variant", "size", "className", "children"].indexOf(k) < 0) rest[k] = p[k];
    return h(
      "button",
      Object.assign({
        type: p.type || "button",
        className: cx("lc-btn", "lc-btn--" + variant, "lc-btn--" + size, p.className)
      }, rest),
      p.children
    );
  }

  /* ------------------------------------------------------------ StatusChip */
  function StatusChip(props) {
    var p = props || {};
    var token = p.token || "status-parado";
    return h(
      "span",
      {
        className: cx("lc-chip", p.loose ? "lc-chip--loose" : null, p.className),
        style: { color: "var(--" + token + "-ink)" }
      },
      h("span", { className: "lc-chip__dot", style: { background: "var(--" + token + ")" } }),
      p.children || p.label
    );
  }

  /* ----------------------------------------------------------------- Field */
  function Field(props) {
    var p = props || {};
    var id = p.id || ("lc-f-" + Math.random().toString(36).slice(2, 8));
    var big = p.size === "lg";
    var Input = p.multiline ? "textarea" : "input";
    return h(
      "div", { className: cx("lc-field", p.className) },
      p.label ? h(
        "label",
        { className: cx("lc-field__label", p.calc ? "lc-field__label--muted" : null), htmlFor: id },
        p.label, p.calc ? " (calc.)" : null
      ) : null,
      h(Input, {
        id: id,
        type: p.multiline ? undefined : (p.type || "text"),
        rows: p.multiline ? (p.rows || 3) : undefined,
        placeholder: p.placeholder,
        defaultValue: p.value,
        readOnly: p.calc || p.readOnly,
        disabled: p.disabled,
        "aria-invalid": p.error ? "true" : undefined,
        className: cx("lc-field__input", big ? "lc-field__input--lg" : null,
                      p.calc ? "lc-field__input--calc" : null,
                      p.error ? "lc-field__input--error" : null),
        style: p.multiline ? { height: "auto", padding: "8px 12px", lineHeight: "20px" } : undefined
      }),
      p.error ? h("p", { className: "lc-field__msg" }, p.error) : null
    );
  }

  /* ------------------------------------------------------------- DataTable */
  function DataTable(props) {
    var p = props || {};
    var cols = p.columns || [];
    var rows = p.rows || [];
    var blank = p.blank === undefined ? "-" : p.blank;
    return h(
      "table", { className: cx("lc-table", p.className) },
      h("thead", null, h("tr", null, cols.map(function (c, i) {
        return h("th", {
          key: c.key || i,
          className: c.num ? "is-num" : null,
          style: c.width ? { width: c.width } : undefined,
          title: c.label
        }, c.label);
      }))),
      h("tbody", null, rows.map(function (r, ri) {
        return h("tr", { key: ri, style: p.cozy ? { height: "var(--row-h-cozy)" } : undefined },
          cols.map(function (c, ci) {
            var v = r[c.key];
            var empty = v === undefined || v === null || v === "";
            return h("td", {
              key: c.key || ci,
              className: cx(ci === 0 && c.plain !== true ? "is-first" : null,
                            c.num ? "is-num" : null,
                            empty ? "is-empty" : null),
              title: typeof v === "string" ? v : undefined
            }, empty ? blank : v);
          }));
      })),
      p.footer ? h("tfoot", null, h("tr", null, cols.map(function (c, i) {
        var v = p.footer[c.key];
        return h("td", { key: c.key || i, className: c.num ? "is-num" : null },
          v === undefined ? "" : v);
      }))) : null
    );
  }

  /* ---------------------------------------------------------------- Dialog */
  var DIALOG_W = { sm: "var(--dialog-w-sm)", md: "var(--dialog-w-md)", lg: "var(--dialog-w-lg)" };
  function Dialog(props) {
    var p = props || {};
    return h(
      "div", { className: cx("lc-overlay", p.className) },
      h("div", { className: "lc-dialog", role: "dialog", "aria-modal": "true",
                 style: { maxWidth: DIALOG_W[p.width || "sm"] } },
        h("div", { className: "lc-dialog__head" },
          p.context ? h("p", { className: "lc-dialog__ctx" }, p.context) : null,
          h("h2", { className: "lc-dialog__title" }, p.title)),
        h("div", { className: "lc-dialog__body" }, p.children),
        p.footer ? h("div", { className: "lc-dialog__foot" }, p.footer) : null)
    );
  }

  /* ---------------------------------------------------------------- Estados */
  function EmptyState(props) {
    var p = props || {};
    return h(
      "div", { className: cx("lc-empty", p.className) },
      h("div", { style: { display: "flex", justifyContent: "center", opacity: 0.55 } },
        h(Symbol_, { size: p.symbolSize || 40, tone: "mono" })),
      h("p", { className: "lc-empty__title" }, p.title || "Nada por aqui"),
      p.hiddenCount ? h("p", { className: "lc-empty__hint" },
        p.hiddenCount + " estão escondidos pelo filtro") : null,
      p.onClear !== false ? h(Button, { variant: "secondary", size: "sm", onClick: p.onClear },
        p.clearLabel || "Limpar filtros") : null
    );
  }

  function LoadingSkeleton(props) {
    var p = props || {};
    var n = p.rows || 4;
    var widths = p.widths || ["78%", "54%", "88%", "42%", "66%", "70%"];
    var items = [];
    for (var i = 0; i < n; i++) {
      items.push(h("div", {
        key: i, className: "lc-skel",
        style: { width: widths[i % widths.length], marginBottom: "var(--space-5)" }
      }));
    }
    return h("div", { className: p.className, "aria-busy": "true", "aria-live": "polite" }, items);
  }

  function NoticeCard(props) {
    var p = props || {};
    var tone = p.tone || "danger";
    return h(
      "div", { className: cx("lc-notice", "lc-notice--" + tone, p.className),
               role: tone === "danger" ? "alert" : undefined },
      h("p", { className: "lc-notice__title" }, p.title),
      h("p", { className: "lc-notice__body" }, p.children || p.body),
      p.actionLabel ? h("p", { style: { margin: "var(--space-5) 0 0" } },
        h(Button, { variant: tone === "danger" ? "dangerOutline" : "secondary", size: "sm",
                    onClick: p.onAction }, p.actionLabel)) : null
    );
  }

  /* ----------------------------------------------------------------- Casca */
  function AppBar(props) {
    var p = props || {};
    return h(
      "header", { className: cx("lc-appbar", p.className) },
      h("div", { className: "lc-appbar__brand" },
        h(Logo, { size: 30, nameSize: 22, chip: p.chip === undefined ? "CAPITAL" : p.chip,
                  href: p.href || "#", stacked: true })),
      h("div", { className: "lc-appbar__right" },
        h(Button, { variant: "tertiary", size: "md", title: "Sair", "aria-label": "Sair" }, "\u21AA"),
        h(Button, { variant: "tertiary", size: "md", title: "Trocar senha",
                    "aria-label": "Trocar senha" }, "\u26BF"),
        p.settings === false ? null : h(Button, { variant: "secondary", size: "md" },
          h("span", { "aria-hidden": "true", style: { marginRight: "6px" } }, "\u2699"),
          "Configurações"))
    );
  }

  var NAV_ORDER = ["Funil de Clientes", "Cliente", "Fornecedor", "Operação", "Esteira de Estruturação"];

  function SideNav(props) {
    var p = props || {};
    var items = p.items || NAV_ORDER;
    return h(
      "nav", { className: cx("lc-sidenav", p.className), "aria-label": p.label || "Navegação principal" },
      items.map(function (item, i) {
        var label = typeof item === "string" ? item : item.label;
        var active = typeof item === "string" ? label === p.active : item.active;
        return h("a", {
          key: i, href: (item && item.href) || "#",
          className: cx("lc-navitem", active ? "lc-navitem--active" : null),
          "aria-current": active ? "page" : undefined
        },
          h("span", { className: "lc-navitem__icon", "aria-hidden": "true" },
            (p.icons && p.icons[label]) || "\u25A0"),
          h("span", { className: "lc-navitem__label" }, label));
      })
    );
  }

  function Footer(props) {
    var p = props || {};
    var links = p.links || ["Suporte", "Documentação", "Privacidade"];
    return h(
      "footer", { className: cx("lc-footer", p.className) },
      h(Logo, { tone: "white", chip: p.chip === undefined ? "CRM" : p.chip }),
      h("span", { style: { fontSize: "12px", color: "var(--neutral-500)" } },
        p.tagline || "Ferramenta interna · Lure Consultoria"),
      h("nav", { style: { marginLeft: "auto", display: "flex", gap: "18px" } },
        links.map(function (l, i) {
          return h("a", { key: i, href: "#" }, typeof l === "string" ? l : l.label);
        })),
      h("span", {
        style: { width: "100%", fontSize: "11px", color: "var(--neutral-600)",
                 fontFamily: "var(--font-mono)" }
      }, p.copyright || "© 2026 Lure Consultoria. Todos os direitos reservados.")
    );
  }

  global.LureCapital = {
    Symbol: Symbol_, Logo: Logo, AppBar: AppBar, SideNav: SideNav, Footer: Footer,
    Button: Button, StatusChip: StatusChip, Field: Field, DataTable: DataTable,
    Dialog: Dialog, EmptyState: EmptyState, LoadingSkeleton: LoadingSkeleton, NoticeCard: NoticeCard
  };
})(window);
