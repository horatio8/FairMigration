/* @ds-bundle: {"format":3,"namespace":"FairMigrationDesignSystem_e28435","components":[{"name":"Button","sourcePath":"components/buttons/Button.jsx"},{"name":"PetitionForm","sourcePath":"components/campaign/PetitionForm.jsx"},{"name":"Badge","sourcePath":"components/content/Badge.jsx"},{"name":"Card","sourcePath":"components/content/Card.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"SiteHeader","sourcePath":"components/navigation/SiteHeader.jsx"}],"sourceHashes":{"components/buttons/Button.jsx":"89d8960fe9d3","components/campaign/PetitionForm.jsx":"5d722bb1356f","components/content/Badge.jsx":"7c8d2d4b54e9","components/content/Card.jsx":"4feac6193e91","components/forms/Input.jsx":"937ea5a62f45","components/navigation/SiteHeader.jsx":"caa822dba048"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.FairMigrationDesignSystem_e28435 = window.FairMigrationDesignSystem_e28435 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/buttons/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Fair Migration — Button
 * Civic CTA button. Default "primary" is the brand RED action; "solid"
 * is filled navy; "outline" is the white-on-navy chip; "donate" is red.
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  href,
  disabled = false,
  fullWidth = false,
  iconLeft,
  iconRight,
  onClick,
  style,
  ...rest
}) {
  const sizes = {
    sm: {
      fontSize: '13px',
      padding: '8px 14px',
      gap: '6px'
    },
    md: {
      fontSize: '15px',
      padding: '11px 20px',
      gap: '8px'
    },
    lg: {
      fontSize: '17px',
      padding: '15px 28px',
      gap: '10px'
    }
  };
  const variants = {
    primary: {
      background: 'var(--red-500)',
      color: 'var(--white)',
      border: '1px solid var(--red-500)',
      boxShadow: 'var(--shadow-xs)'
    },
    solid: {
      background: 'var(--navy-700)',
      color: 'var(--white)',
      border: '1px solid var(--navy-700)',
      boxShadow: 'var(--shadow-xs)'
    },
    donate: {
      background: 'var(--red-500)',
      color: 'var(--white)',
      border: '1px solid var(--red-500)',
      boxShadow: 'var(--shadow-xs)'
    },
    outline: {
      background: 'var(--white)',
      color: 'var(--navy-700)',
      border: '1px solid var(--line-200)',
      boxShadow: 'var(--shadow-xs)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--navy-700)',
      border: '1px solid transparent',
      boxShadow: 'none'
    }
  };
  const base = {
    display: fullWidth ? 'flex' : 'inline-flex',
    width: fullWidth ? '100%' : 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-sans)',
    fontWeight: 700,
    lineHeight: 1,
    letterSpacing: '0.005em',
    borderRadius: 'var(--radius-md)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'background .15s ease, color .15s ease, transform .05s ease, box-shadow .15s ease',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...sizes[size],
    ...variants[variant],
    ...style
  };
  const hoverFor = {
    primary: (e, on) => {
      e.currentTarget.style.background = on ? 'var(--red-600)' : 'var(--red-500)';
    },
    solid: (e, on) => {
      e.currentTarget.style.background = on ? 'var(--navy-800)' : 'var(--navy-700)';
    },
    donate: (e, on) => {
      e.currentTarget.style.background = on ? 'var(--red-600)' : 'var(--red-500)';
    },
    outline: (e, on) => {
      e.currentTarget.style.background = on ? 'var(--mist-50)' : 'var(--white)';
    },
    ghost: (e, on) => {
      e.currentTarget.style.background = on ? 'var(--navy-50)' : 'transparent';
    }
  };
  const handlers = disabled ? {} : {
    onMouseEnter: e => hoverFor[variant](e, true),
    onMouseLeave: e => {
      hoverFor[variant](e, false);
      e.currentTarget.style.transform = 'none';
    },
    onMouseDown: e => {
      e.currentTarget.style.transform = 'translateY(1px)';
    },
    onMouseUp: e => {
      e.currentTarget.style.transform = 'none';
    },
    onClick
  };
  const content = /*#__PURE__*/React.createElement(React.Fragment, null, iconLeft ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex'
    }
  }, iconLeft) : null, children, iconRight ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex'
    }
  }, iconRight) : null);
  if (href && !disabled) {
    return /*#__PURE__*/React.createElement("a", _extends({
      href: href,
      style: base
    }, handlers, rest), content);
  }
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    style: base,
    disabled: disabled
  }, handlers, rest), content);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/Button.jsx", error: String((e && e.message) || e) }); }

// components/content/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Fair Migration — Badge
 * Small status / label pill. Soft tinted fills for civic restraint;
 * the "caps" tone renders the brand's all-caps emphasis device.
 */
function Badge({
  children,
  tone = 'navy',
  caps = false,
  style,
  ...rest
}) {
  const tones = {
    navy: {
      bg: 'var(--navy-100)',
      fg: 'var(--navy-700)'
    },
    red: {
      bg: '#fbe3e3',
      fg: 'var(--red-600)'
    },
    coral: {
      bg: 'var(--coral-200)',
      fg: '#9a4a31'
    },
    neutral: {
      bg: 'var(--mist-100)',
      fg: 'var(--ink-700)'
    },
    success: {
      bg: '#e3f1ea',
      fg: 'var(--color-success)'
    }
  };
  const t = tones[tone] || tones.navy;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      background: t.bg,
      color: t.fg,
      fontFamily: 'var(--font-sans)',
      fontSize: '12px',
      fontWeight: 700,
      lineHeight: 1,
      letterSpacing: caps ? 'var(--ls-caps)' : '0.01em',
      textTransform: caps ? 'uppercase' : 'none',
      padding: '6px 10px',
      borderRadius: 'var(--radius-sm)',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/Badge.jsx", error: String((e && e.message) || e) }); }

// components/content/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Fair Migration — Card
 * Squared-ish white surface (8px radius) with a hairline border and a
 * subtle shadow. Optional accent strip in navy / red / coral along the top.
 */
function Card({
  children,
  accent,
  // 'navy' | 'red' | 'coral' | undefined
  padding = 'var(--space-6)',
  elevated = false,
  style,
  ...rest
}) {
  const accentColor = {
    navy: 'var(--navy-700)',
    red: 'var(--red-500)',
    coral: 'var(--coral-400)'
  }[accent];
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      background: 'var(--surface-card)',
      border: '1px solid var(--line-200)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: elevated ? 'var(--shadow-md)' : 'var(--shadow-sm)',
      padding,
      overflow: 'hidden',
      fontFamily: 'var(--font-sans)',
      color: 'var(--ink-900)',
      ...style
    }
  }, rest), accentColor ? /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '4px',
      background: accentColor
    }
  }) : null, children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/Card.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Fair Migration — Input
 * White field, ~5px radius, no visible border at rest (sits on a thin
 * hairline), navy focus ring. Supports an optional label and hint, and
 * renders a textarea when multiline.
 */
function Input({
  label,
  hint,
  type = 'text',
  name,
  value,
  defaultValue,
  placeholder,
  required = false,
  disabled = false,
  invalid = false,
  multiline = false,
  rows = 4,
  onChange,
  style,
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  const fieldStyle = {
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'var(--font-sans)',
    fontSize: '16px',
    lineHeight: 1.5,
    color: 'var(--ink-900)',
    background: disabled ? 'var(--mist-100)' : 'var(--white)',
    border: `1px solid ${invalid ? 'var(--red-500)' : focused ? 'var(--navy-700)' : 'var(--line-200)'}`,
    borderRadius: 'var(--radius-md)',
    padding: multiline ? '12px 14px' : '12px 14px',
    boxShadow: focused ? 'var(--shadow-focus)' : 'var(--shadow-xs)',
    outline: 'none',
    transition: 'border-color .15s ease, box-shadow .15s ease',
    resize: multiline ? 'vertical' : undefined,
    ...style
  };
  const shared = {
    name,
    value,
    defaultValue,
    placeholder,
    required,
    disabled,
    onChange,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style: fieldStyle,
    'aria-invalid': invalid || undefined,
    ...rest
  };
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block',
      fontFamily: 'var(--font-sans)'
    }
  }, label ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      marginBottom: '6px',
      fontSize: '14px',
      fontWeight: 600,
      color: 'var(--ink-700)'
    }
  }, label, required ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--red-500)'
    }
  }, " *") : null) : null, multiline ? /*#__PURE__*/React.createElement("textarea", _extends({
    rows: rows
  }, shared)) : /*#__PURE__*/React.createElement("input", _extends({
    type: type
  }, shared)), hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      marginTop: '6px',
      fontSize: '13px',
      color: invalid ? 'var(--red-500)' : 'var(--ink-500)'
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/campaign/PetitionForm.jsx
try { (() => {
/**
 * Fair Migration — PetitionForm
 * The core conversion unit: a compact white card with name / email /
 * postcode fields, a consent line, and a full-width "Sign the petition"
 * CTA. Reports collected values via onSign.
 */
function PetitionForm({
  title = 'Sign the petition',
  blurb = 'Demand the Federal Government acts now.',
  ctaLabel = 'Sign the petition',
  signatures,
  onSign,
  style
}) {
  const [data, setData] = React.useState({
    name: '',
    email: '',
    postcode: '',
    consent: true
  });
  const set = k => e => setData(d => ({
    ...d,
    [k]: e.target.value
  }));
  const submit = e => {
    e.preventDefault();
    onSign && onSign(data);
  };
  return /*#__PURE__*/React.createElement("form", {
    onSubmit: submit,
    style: {
      background: 'var(--white)',
      border: '1px solid var(--line-200)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-md)',
      padding: 'var(--space-8)',
      fontFamily: 'var(--font-sans)',
      maxWidth: '460px',
      boxSizing: 'border-box',
      ...style
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '0 0 6px',
      fontSize: '24px',
      fontWeight: 900,
      letterSpacing: 'var(--ls-tight)',
      color: 'var(--ink-900)'
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 20px',
      fontSize: '15px',
      lineHeight: 1.5,
      color: 'var(--ink-700)'
    }
  }, blurb), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: '14px'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Input, {
    label: "Full name",
    name: "name",
    placeholder: "Jane Citizen",
    required: true,
    value: data.name,
    onChange: set('name')
  }), /*#__PURE__*/React.createElement(__ds_scope.Input, {
    label: "Email",
    type: "email",
    name: "email",
    placeholder: "jane@example.com.au",
    required: true,
    value: data.email,
    onChange: set('email')
  }), /*#__PURE__*/React.createElement(__ds_scope.Input, {
    label: "Postcode",
    name: "postcode",
    placeholder: "2000",
    value: data.postcode,
    onChange: set('postcode')
  })), /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      gap: '10px',
      alignItems: 'flex-start',
      margin: '16px 0 20px',
      fontSize: '13px',
      color: 'var(--ink-500)',
      lineHeight: 1.5
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    defaultChecked: true,
    style: {
      marginTop: '2px',
      accentColor: 'var(--navy-700)',
      width: '16px',
      height: '16px'
    }
  }), /*#__PURE__*/React.createElement("span", null, "I'd like to receive campaign updates. We'll never share your details.")), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    type: "submit",
    variant: "primary",
    size: "lg",
    fullWidth: true
  }, ctaLabel), signatures != null ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '14px 0 0',
      textAlign: 'center',
      fontSize: '13px',
      fontWeight: 700,
      color: 'var(--navy-700)'
    }
  }, signatures.toLocaleString(), " Australians have signed") : null);
}
Object.assign(__ds_scope, { PetitionForm });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/campaign/PetitionForm.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SiteHeader.jsx
try { (() => {
/**
 * Fair Migration — SiteHeader
 * White, sticky-feeling top bar: navy stacked wordmark at left,
 * "Act now" link + "Donate" button at right. Thin bottom hairline.
 */
function SiteHeader({
  logoSrc = 'assets/logo-full.png',
  links = [{
    label: 'Act now',
    href: '#'
  }],
  onDonate,
  donateHref = '#',
  style
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 'var(--space-6)',
      height: 'var(--header-h)',
      padding: '0 var(--space-8)',
      background: 'var(--white)',
      borderBottom: '1px solid var(--line-200)',
      fontFamily: 'var(--font-sans)',
      boxSizing: 'border-box',
      ...style
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      display: 'inline-flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: logoSrc,
    alt: "Fair Migration",
    style: {
      height: '40px',
      width: 'auto',
      display: 'block'
    }
  })), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-6)'
    }
  }, links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l.label,
    href: l.href,
    style: {
      fontSize: '15px',
      fontWeight: 700,
      color: 'var(--ink-900)',
      textDecoration: 'none',
      letterSpacing: '0.01em',
      whiteSpace: 'nowrap'
    },
    onMouseEnter: e => {
      e.currentTarget.style.color = 'var(--navy-700)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.color = 'var(--ink-900)';
    }
  }, l.label)), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "donate",
    size: "sm",
    href: donateHref,
    onClick: onDonate
  }, "Donate")));
}
Object.assign(__ds_scope, { SiteHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SiteHeader.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.PetitionForm = __ds_scope.PetitionForm;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.SiteHeader = __ds_scope.SiteHeader;

})();
