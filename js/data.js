// =====================================================================
//  CONFIGURACIÓN DEL CUESTIONARIO
//  Para agregar preguntas solo edita este archivo.
//
//  Tipos de pregunta (type):
//    text | email | tel | url | number | days | textarea | date | datetime
//    select | radio | checks | visual_style | repeater
//  Opciones útiles:
//    showIf  -> regla para mostrarla. Ej: { id: 'ba_logo', eq: 'Sí' }
//               { id, ne } { id, in: [...] } { id, has: 'x' } { id, filled: true }
//               { any: [reglas] } { all: [reglas] }
//    upload  -> permite adjuntar archivos/imágenes
//    max     -> (checks) máximo de opciones
//    opt     -> pregunta de detalle: se oculta en "Modo exprés" (ver OPTIONAL_IDS abajo)
//    Las opciones que empiezan con "Otro/Otra/Especifique" abren un campo de texto.
//  Secciones:
//    kind: 'form' (preguntas) | 'audit' (estado / riesgo / prioridad)
//    devTypes: ['web','app','platform'] -> solo aparece si el proyecto lo incluye
//    platKinds: ['erp','crm','custom'] -> solo aparece si se eligió ese tipo de plataforma
//    showIf: regla para habilitar la sección completa
// =====================================================================

export const PILLARS = {
    branding: { label: 'Branding', short: 'Branding', icon: 'fa-palette', desc: 'Identidad visual, estrategia y papelería', color: '#b26cf0' },
    dev: { label: 'Desarrollo', short: 'Desarrollo', icon: 'fa-code', desc: 'Web, apps, ERP, CRM y plataformas a la medida', color: '#4cc9f0' },
    ops: { label: 'Operaciones', short: 'Operación', icon: 'fa-gears', desc: 'Procesos, indicadores y automatización', color: '#b8f04a' },
    social: { label: 'Redes Sociales', short: 'Social', icon: 'fa-share-nodes', desc: 'Brief mensual, contenido y pauta', color: '#ff5d8f' },
    extra: { label: 'Adicionales', short: 'Extras', icon: 'fa-circle-plus', desc: 'Material bajo demanda', color: '#ffb547' }
};

export const DEV_TYPES = {
    web: { label: 'Sitio Web', icon: 'fa-globe', desc: 'Corporativo, landing page o tienda en línea' },
    app: { label: 'Aplicación Móvil', icon: 'fa-mobile-screen', desc: 'iOS, Android o multiplataforma' },
    platform: { label: 'Plataforma tecnológica', icon: 'fa-layer-group', desc: 'ERP, CRM, SaaS, portal o sistema a la medida' }
};

export const PLATFORM_KINDS = {
    erp: {
        label: 'ERP', name: 'Planeación de recursos', icon: 'fa-cubes', color: '#ffb547',
        tagline: 'Toda la operación en un solo sistema: inventario, compras, ventas, facturación y finanzas.',
        features: ['Inventarios y almacenes', 'Compras y proveedores', 'Facturación CFDI 4.0', 'Contabilidad y finanzas']
    },
    crm: {
        label: 'CRM', name: 'Ventas y clientes', icon: 'fa-handshake', color: '#ff5d8f',
        tagline: 'Que ningún prospecto se pierda: embudo, seguimiento automático y métricas de ventas.',
        features: ['Pipeline de ventas', 'Leads de web, WhatsApp y Ads', 'Seguimiento automático', 'Desempeño por vendedor']
    },
    custom: {
        label: 'Personalizada', name: 'Software a la medida', icon: 'fa-wand-magic-sparkles', color: '#b26cf0',
        tagline: 'Un sistema hecho para un proceso único del negocio, construido por fases.',
        features: ['Flujos propios del negocio', 'Roles y permisos a medida', 'Integraciones vía API', 'MVP y crecimiento por fases']
    }
};

export const AUDIT_STATUS = ['Cumple', 'Parcial', 'No cumple', 'Desconocido', 'No aplica'];
export const AUDIT_RISK = ['Bajo', 'Medio', 'Alto', 'Crítico'];
export const AUDIT_PRIORITY = ['1 · Inmediato', '2 · Corto plazo', '3 · Mejora futura'];

const RESPONSIBLE_FIELDS = [
    { k: 'name', label: 'Nombre del responsable', placeholder: 'Nombre completo' },
    { k: 'contact', label: 'Contacto', placeholder: 'WhatsApp / Tel / Correo' },
    { k: 'days_agency', label: 'Días hábiles (agencia)', type: 'number', placeholder: '3' },
    { k: 'days_client', label: 'Días hábiles (cliente)', type: 'number', placeholder: '5' }
];
export const RESPONSIBLES_ITEM = { label: 'Responsable(s) de aprobación', type: 'repeater', fields: RESPONSIBLE_FIELDS, addLabel: 'Agregar responsable', rowLabel: 'Responsable' };

const LOGO_REDESIGN = ['Evolución (modernizar sutilmente)', 'Rediseño total'];

export const SECTIONS = [
    // ===================== BRANDING =====================
    {
        key: 'branding_general', pillar: 'branding', title: 'Datos generales y contacto', icon: 'fa-building', hasResponsible: true,
        items: [
            { id: 'bg_name', label: 'Nombre comercial de la empresa / marca', type: 'text', required: true },
            { id: 'bg_legal', label: 'Régimen jurídico', type: 'text', placeholder: 'Ej. S.A. de C.V.' },
            { id: 'bg_slogan', label: 'Slogan de la empresa', type: 'text' },
            { id: 'bg_contact_name', label: 'Contacto principal del proyecto', type: 'text' },
            { id: 'bg_contact_role', label: 'Cargo / puesto', type: 'text' },
            { id: 'bg_contact_phone', label: 'Teléfono / WhatsApp', type: 'tel' },
            { id: 'bg_contact_email', label: 'Correo electrónico', type: 'email' },
            { id: 'bg_phone_official', label: 'Teléfono oficial de la empresa', type: 'tel' },
            { id: 'bg_phone_corp', label: 'Teléfono general / corporativo', type: 'tel', desc: 'Administración, proveedores o recepción' },
            { id: 'bg_phone_sales', label: 'Teléfono de ventas / atención a clientes', type: 'tel' },
            { id: 'bg_who', label: '¿Quiénes somos?', type: 'textarea', desc: 'Descripción breve de la empresa' },
            { id: 'bg_mission', label: 'Misión', type: 'textarea' },
            { id: 'bg_vision', label: 'Visión', type: 'textarea' },
            { id: 'bg_values', label: 'Valores', type: 'textarea' },
            { id: 'bg_founded', label: '¿Cuándo se fundó la empresa?', type: 'text', placeholder: 'Año' },
            { id: 'bg_branches', label: '¿Cuentan con más de una sucursal?', type: 'radio', options: ['Sí', 'No'] },
            { id: 'bg_address', label: 'Dirección(es) oficial(es)', type: 'textarea', placeholder: 'Una dirección por línea' },
            { id: 'bg_decision', label: '¿Quién aprueba el diseño final?', type: 'select', options: ['Contacto principal', 'Un socio o superior', 'Grupo de personas', 'Otro'] },
            { id: 'bg_decision_name', label: 'Nombre y número del decisor', type: 'text', showIf: { id: 'bg_decision', in: ['Un socio o superior', 'Grupo de personas', 'Otro'] } },
            { id: 'bg_approval_days', label: 'Tiempo de respuesta para aprobaciones', type: 'days' },
            { id: 'bg_socials', label: '¿En qué redes sociales tienen presencia?', type: 'checks', options: ['Instagram', 'Facebook', 'TikTok', 'LinkedIn', 'YouTube', 'X', 'Ninguna'] },
            { id: 'bg_social_handles', label: 'Usuarios de redes sociales', type: 'textarea', placeholder: 'Instagram: @usuario\nFacebook: Nombre de página', showIf: { all: [{ id: 'bg_socials', filled: true }, { id: 'bg_socials', notHas: 'Ninguna' }] } },
            { id: 'bg_social_access', label: '¿Tienen los accesos a ellas?', type: 'radio', options: ['Sí', 'No', 'Parcialmente'], showIf: { all: [{ id: 'bg_socials', filled: true }, { id: 'bg_socials', notHas: 'Ninguna' }] } },
            { id: 'bg_security_note', label: 'Sesión remota para transferencia de accesos', type: 'datetime', desc: 'Asignar responsable técnico para una sesión de 30 min.', showIf: { id: 'bg_social_access', in: ['Sí', 'Parcialmente'] } },
            { id: 'bg_website', label: '¿Cuentan con página web?', type: 'radio', options: ['Sí, actualizada', 'Sí, pero desactualizada', 'No'] },
            { id: 'bg_website_url', label: 'Enlace del sitio web', type: 'url', placeholder: 'https://', showIf: { id: 'bg_website', in: ['Sí, actualizada', 'Sí, pero desactualizada'] } }
        ]
    },
    {
        key: 'branding_audit', pillar: 'branding', title: 'Auditoría de marca', icon: 'fa-eye', hasResponsible: true,
        items: [
            { id: 'ba_logo', label: '¿La empresa cuenta con logotipo?', type: 'radio', options: ['Sí', 'No'], upload: { showIf: { id: 'ba_logo', eq: 'Sí' }, hint: 'Sube el logotipo actual (.PNG, .JPG, .SVG, .PDF)' } },
            { id: 'ba_logo_new', label: '¿Desean crear un logotipo desde cero?', type: 'radio', options: ['Sí', 'No por ahora'], showIf: { id: 'ba_logo', eq: 'No' } },
            { id: 'ba_logo_action', label: '¿Qué se desea hacer con el logotipo?', type: 'select', options: ['Sin cambios', ...LOGO_REDESIGN, 'Vectorización / limpieza'], showIf: { id: 'ba_logo', eq: 'Sí' } },
            { id: 'ba_editable', label: '¿Cuentan con archivos EDITABLES (.AI, .EPS, .PDF, .SVG)?', type: 'radio', options: ['Sí', 'No, solo imágenes (.JPG, .PNG)'], showIf: { id: 'ba_logo', eq: 'Sí' } },
            { id: 'ba_editable_days', label: 'Días hábiles para aprobación de logotipo', type: 'days', showIf: { any: [{ id: 'ba_logo_action', in: [...LOGO_REDESIGN, 'Vectorización / limpieza'] }, { id: 'ba_logo_new', eq: 'Sí' }] } },
            { id: 'ba_manual', label: '¿Tienen Manual de Identidad Corporativa?', type: 'radio', options: ['Sí', 'No', 'Desactualizado'], upload: { showIf: { id: 'ba_manual', in: ['Sí', 'Desactualizado'] }, hint: 'Adjunta el manual actual (opcional)' } },
            { id: 'ba_manual_days', label: 'Días hábiles para aprobación del manual', type: 'days', showIf: { id: 'ba_manual', in: ['No', 'Desactualizado'] } }
        ]
    },
    {
        key: 'branding_strategy', pillar: 'branding', title: 'ADN de la marca', icon: 'fa-chess-knight',
        items: [
            { id: 'bs_competitors', label: 'Competidores directos', type: 'repeater', fields: [{ k: 'name', label: 'Nombre', placeholder: 'Empresa' }, { k: 'link', label: 'Link', placeholder: 'https:// o @usuario' }], addLabel: 'Agregar competidor', rowLabel: 'Competidor', minRows: 2 },
            { id: 'bs_usp', label: '¿Qué te diferencia de ellos?', type: 'textarea', desc: 'Ventaja competitiva' },
            { id: 'bs_gender', label: 'Público objetivo: género', type: 'radio', options: ['Hombres', 'Mujeres', 'Ambos / indistinto'] },
            { id: 'bs_age', label: 'Rango de edad promedio', type: 'text', placeholder: 'De 25 a 45 años' },
            { id: 'bs_sector', label: 'Sector / giro del mercado meta', type: 'checks', options: ['Industrial', 'Comercial', 'De servicios', 'Agropecuario', 'Primario', 'Otro'] }
        ]
    },
    {
        key: 'branding_design', pillar: 'branding', title: 'Preferencias de diseño', icon: 'fa-pen-ruler',
        desc: 'Aplica cuando se crea, evoluciona o rediseña el logotipo.',
        showIf: { any: [{ id: 'ba_logo_action', in: LOGO_REDESIGN }, { id: 'ba_logo_new', eq: 'Sí' }] },
        lockedHint: 'Se habilita al elegir "Evolución", "Rediseño total" o "crear logotipo" en Auditoría de marca.',
        lockedGoto: 'branding_audit',
        items: [
            { id: 'bd_regimen', label: '¿El logotipo integrará el régimen jurídico?', type: 'radio', options: ['Sí', 'No'] },
            { id: 'bd_style', label: 'Estilo visual preferido', type: 'visual_style' },
            { id: 'bd_personality', label: 'Personalidad de la marca', type: 'checks', desc: 'Elige las que mejor describan el carácter de la marca', options: ['Femenino / delicado', 'Masculino / rudo', 'Económico / accesible', 'Lujo / exclusivo', 'Juguetón / divertido', 'Serio / corporativo', 'Clásico / tradicional', 'Moderno / minimalista'] },
            { id: 'bd_colors_yes', label: 'Colores obligatorios', type: 'text', placeholder: 'Colores que debemos usar' },
            { id: 'bd_colors_no', label: 'Colores prohibidos', type: 'text', placeholder: 'Colores a NO utilizar' },
            { id: 'bd_refs', label: 'Referencias visuales que les gusten', type: 'textarea', placeholder: 'Links o descripciones', upload: { hint: 'Sube imágenes de referencia' } }
        ]
    },
    {
        key: 'branding_needs', pillar: 'branding', title: 'Inventario de necesidades', icon: 'fa-clipboard-list',
        items: [
            { id: 'bn_admin', label: 'Papelería administrativa requerida', type: 'checks', options: ['Manual de identidad corporativa', 'Tarjeta de presentación', 'Hoja membretada', 'Firma de correo electrónico', 'Gafetes / credenciales', 'Sobres (carta / oficio / bolsa)', 'Notas de remisión / recetas', 'Facturas (diseño PDF)', 'Hoja de cotización', 'Otro'] },
            { id: 'bn_admin_days', label: 'Días hábiles para aprobación de papelería', type: 'days', desc: 'Manual corporativo: desde 3 días hábiles. Aplicativos sencillos: desde 1 día hábil.', showIf: { id: 'bn_admin', filled: true } },
            { id: 'bn_contact', label: 'Información a incluir en papelería', type: 'checks', options: ['Identidad personal (nombre, puesto)', 'Canales digitales (web y redes)', 'Código QR (web, portafolio o WhatsApp)', 'Número telefónico', 'Correo electrónico', 'Ubicación física (dirección)', 'Datos fiscales / legales (RFC)'], showIf: { id: 'bn_admin', filled: true } },
            { id: 'bn_personnel', label: 'Personas con papelería corporativa', type: 'repeater', desc: 'Tarjetas de presentación, firmas electrónicas, gafetes, etc.', fields: [{ k: 'name', label: 'Nombre' }, { k: 'puesto', label: 'Puesto' }, { k: 'email', label: 'Correo', type: 'email' }, { k: 'phone', label: 'Teléfono', type: 'tel' }, { k: 'fiscal', label: 'Datos fiscales' }], addLabel: 'Agregar persona', rowLabel: 'Persona', showIf: { id: 'bn_admin', filled: true } },
            { id: 'bn_personnel_days', label: 'Días hábiles para aprobación', type: 'days', showIf: { id: 'bn_admin', filled: true } }
        ]
    },
    {
        key: 'branding_manual', pillar: 'branding', title: 'Manual de identidad', icon: 'fa-book',
        desc: 'Incluye mockups (fotomontajes realistas) de la marca aplicada en objetos físicos.',
        showIf: { id: 'bn_admin', has: 'Manual de identidad corporativa' },
        lockedHint: 'Se habilita al marcar "Manual de identidad corporativa" en Inventario de necesidades.',
        lockedGoto: 'branding_needs',
        items: [
            { id: 'bm_stationery', label: 'A. Papelería corporativa', type: 'checks', options: ['Tarjeta de presentación', 'Hoja membretada (carta)', 'Folder / carpeta corporativa', 'Sobre (americano / oficio / bolsa)', 'Gafete / credencial', 'Firma de correo electrónico'] },
            { id: 'bm_uniform', label: 'B. Vestimenta y uniformes', type: 'checks', options: ['Camiseta tipo polo (bordado)', 'Camisa de vestir', 'Mandil / delantal', 'Gorra / casco'] },
            { id: 'bm_promo', label: 'C. Material promocional', type: 'checks', options: ['Taza / termo', 'Bolígrafo', 'Libreta / agenda', 'Bolsa ecológica (tote bag)'] },
            { id: 'bm_signs', label: 'D. Señalética y espacios', type: 'checks', options: ['Recepción (logo en muro)', 'Flotilla vehicular (rotulación)', 'Fachada / anuncio exterior'] },
            { id: 'bm_digital', label: 'E. Entorno digital', type: 'checks', options: ['Avatar / mascota / personaje', 'Plantillas para redes sociales', 'Fondo para videollamadas'] },
            { id: 'bm_comments', label: 'Comentarios adicionales sobre el manual', type: 'textarea' }
        ]
    },
    {
        key: 'branding_catalog', pillar: 'branding', title: 'Catálogos y editorial', icon: 'fa-book-open',
        items: [
            { id: 'bc_need', label: '¿Requieren brochure o catálogo?', type: 'checks', options: ['Brochure corporativo', 'Catálogo de productos / servicios', 'Ninguno por ahora'] },
            { id: 'bc_brochure', label: 'Contenido del brochure corporativo', type: 'checks', desc: 'Objetivo: posicionamiento y confianza', options: ['Perfil básico (historia, misión, visión, valores)', 'Portafolio de servicios', 'Diferenciadores ("por qué elegirnos")', 'Infraestructura (fotos de oficinas / plantas)', 'Alianzas con empresas', 'Portafolio de productos'], showIf: { id: 'bc_need', has: 'Brochure corporativo' } },
            { id: 'bc_catalog', label: 'Contenido del catálogo', type: 'checks', desc: 'Objetivo: conversión y especificaciones técnicas', options: ['Perfil básico (historia, misión, visión, valores)', 'Ficha técnica detallada', 'Tarifario / precios'], showIf: { id: 'bc_need', has: 'Catálogo de productos / servicios' } },
            { id: 'bc_detail', label: 'Detalle de información requerida', type: 'checks', options: ['Descripción comercial (texto persuasivo)', 'Especificaciones técnicas', 'Garantías y soporte'], showIf: { id: 'bc_need', has: 'Catálogo de productos / servicios' } },
            { id: 'bc_pages', label: 'Número aproximado de productos / páginas', type: 'number', showIf: { id: 'bc_need', has: 'Catálogo de productos / servicios' } },
            { id: 'bc_photos', label: 'Estado de las fotografías de producto', type: 'select', options: ['Profesionales (alta resolución, fondo blanco)', 'Capturas de celular', 'Mixto / no tengo (requiere sesión)'], showIf: { all: [{ id: 'bc_need', filled: true }, { id: 'bc_need', notHas: 'Ninguno por ahora' }] } },
            { id: 'bc_ondemand_req', label: '¿Requiere material bajo demanda?', type: 'radio', options: ['Sí', 'No'] },
            { id: 'bc_ondemand_note', label: 'Nota sobre material bajo demanda', type: 'textarea', showIf: { id: 'bc_ondemand_req', eq: 'Sí' } }
        ]
    },
    {
        key: 'branding_delivery', pillar: 'branding', title: 'Entrega de material', icon: 'fa-file-import',
        items: [
            { id: 'bdel_checklist', label: 'Material que entregará el cliente', type: 'checks', options: ['Logotipo actual', 'Manual de marca anterior', 'Fotografías de productos / instalaciones', 'Textos institucionales', 'Accesos a redes / web'] },
            { id: 'bdel_link', label: 'Carpeta compartida (Drive / Dropbox)', type: 'url', placeholder: 'https://' },
            { id: 'bdel_date', label: 'Fecha compromiso de entrega', type: 'date' },
            { id: 'bdel_comments', label: 'Comentarios adicionales', type: 'textarea' }
        ]
    },

    // ===================== DESARROLLO =====================
    {
        key: 'dev_scope', pillar: 'dev', title: 'Alcance del proyecto', icon: 'fa-compass-drafting', hasResponsible: true,
        intro: 'devTypes',
        items: [
            { id: 'dv_stage', label: '¿El proyecto es nuevo o ya existe algo?', type: 'radio', options: ['Proyecto nuevo', 'Rediseño / mejora de algo existente', 'Migración de plataforma'] },
            { id: 'dv_current_url', label: 'Enlace del proyecto actual', type: 'textarea', placeholder: 'URL del sitio, link de la app en tiendas o del sistema', showIf: { id: 'dv_stage', in: ['Rediseño / mejora de algo existente', 'Migración de plataforma'] } },
            { id: 'dv_goal', label: 'Objetivo principal del proyecto', type: 'textarea', placeholder: '¿Qué problema resuelve? ¿Cómo se medirá el éxito?' },
            { id: 'dv_users', label: '¿Quiénes lo usarán?', type: 'checks', options: ['Clientes finales', 'Equipo interno', 'Distribuidores / socios', 'Proveedores', 'Público en general'] },
            { id: 'dv_features', label: 'Funcionalidades clave', type: 'checks', options: ['Registro / inicio de sesión', 'Pagos en línea', 'Reservas / citas', 'Chat / soporte en vivo', 'Notificaciones', 'Multi-idioma', 'Blog / noticias', 'Panel administrativo', 'Integración CRM / ERP', 'Mapas / geolocalización', 'Formularios / cotizador', 'Otro'] },
            { id: 'dv_ecommerce', label: '¿Incluye venta en línea (e-commerce)?', type: 'radio', options: ['Sí', 'No'] },
            { id: 'dv_refs', label: 'Referencias que les gusten', type: 'textarea', placeholder: 'Sitios, apps o sistemas de referencia y qué les gusta de ellos' },
            { id: 'dv_content', label: '¿Quién provee los textos y fotos?', type: 'select', options: ['El cliente', 'La agencia (redacción / fotos)', 'Mixto'] },
            { id: 'dv_launch', label: 'Fecha deseada de lanzamiento', type: 'date' },
            { id: 'dv_budget', label: 'Rango de inversión contemplado', type: 'select', options: ['Por definir', 'Menos de $30,000 MXN', '$30,000 – $80,000 MXN', '$80,000 – $200,000 MXN', 'Más de $200,000 MXN'] }
        ]
    },
    {
        key: 'web_infrastructure', pillar: 'dev', devTypes: ['web', 'platform'], kind: 'audit', title: 'Infraestructura', icon: 'fa-server', hasResponsible: true,
        items: [
            { id: 'web_infrastructure_0', label: 'Acceso a hosting / dominio', desc: 'Credenciales completas y control de DNS.' },
            { id: 'web_infrastructure_1', label: 'Tecnología base (CMS / framework)', desc: 'Versión actual y plugins activos / inactivos.' },
            { id: 'web_infrastructure_2', label: 'Versión PHP / base de datos', desc: 'Versiones actualizadas y con soporte.' },
            { id: 'web_infrastructure_3', label: 'CDN', desc: '¿Servidor dedicado o CDN activo?' },
            { id: 'web_infrastructure_4', label: 'Entorno staging', desc: 'Servidor de pruebas.' },
            { id: 'web_infrastructure_5', label: 'Backups', desc: 'Respaldos automáticos diarios.' },
            { id: 'web_infrastructure_6', label: 'Certificado SSL', desc: 'HTTPS correcto.' },
            { id: 'web_infrastructure_7', label: 'Correos transaccionales', desc: 'SMTP dedicado.' }
        ]
    },
    {
        key: 'web_uiux', pillar: 'dev', kind: 'audit', title: 'Diseño UI/UX', icon: 'fa-object-group', hasResponsible: true,
        items: [
            { id: 'web_uiux_0', label: 'Sistema de diseño', desc: 'Consistencia vs UI Kit.' },
            { id: 'web_uiux_1', label: 'Accesibilidad', desc: 'Contraste, teclado, tamaño de fuentes.' },
            { id: 'web_uiux_2', label: 'Arquitectura de información', desc: 'Menos de 3 clics para lo importante.' },
            { id: 'web_uiux_3', label: 'Analítica de comportamiento', desc: 'Mapas de calor (Hotjar / Clarity).' },
            { id: 'web_uiux_4', label: 'Adaptabilidad táctil', desc: 'Áreas de toque mayores a 44×44 px.' },
            { id: 'web_uiux_5', label: 'Micro-interacciones', desc: 'Feedback visual claro.' },
            { id: 'web_uiux_6', label: 'Estados vacíos y errores', desc: 'Búsquedas sin resultados, pantallas vacías.' },
            { id: 'web_uiux_7', label: 'Voz y tono', desc: 'Enfoque en soluciones.' }
        ]
    },
    {
        key: 'dev_ecommerce', pillar: 'dev', title: 'Tienda en línea', icon: 'fa-cart-shopping',
        showIf: { id: 'dv_ecommerce', eq: 'Sí' },
        lockedHint: 'Se habilita al responder "Sí" a venta en línea en Alcance del proyecto.',
        lockedGoto: 'dev_scope',
        items: [
            { id: 'ec_products', label: 'Cantidad de productos a cargar', type: 'number', placeholder: 'Ej. 120' },
            { id: 'ec_categories', label: 'Estructura de categorías / subcategorías', type: 'textarea' },
            { id: 'ec_types', label: 'Tipos de producto', type: 'checks', options: ['Simples', 'Con variantes (talla, color)', 'Digitales / descargables', 'Servicios / reservas', 'Suscripciones'] },
            { id: 'ec_media', label: 'Fotos y descripciones de producto', type: 'select', options: ['Listas y optimizadas', 'Existen pero requieren edición', 'No existen (requiere sesión / redacción)'] },
            { id: 'ec_payments', label: 'Métodos de pago', type: 'checks', options: ['Mercado Pago', 'Stripe', 'PayPal', 'Openpay', 'Conekta', 'Clip', 'Transferencia / SPEI', 'Pago contra entrega', 'Otro'] },
            { id: 'ec_shipping', label: 'Logística de envíos', type: 'checks', options: ['Envío local', 'Paqueterías nacionales', 'Recoger en tienda', 'Envío gratis desde cierto monto', 'Envíos internacionales', 'Otro'] },
            { id: 'ec_invoice', label: '¿Requieren facturación electrónica (CFDI)?', type: 'radio', options: ['Sí', 'No'] },
            { id: 'ec_migration', label: '¿Importar clientes / pedidos anteriores?', type: 'radio', options: ['Sí', 'No'] },
            { id: 'ec_migration_from', label: '¿Desde qué plataforma?', type: 'text', placeholder: 'Shopify, WooCommerce, Excel…', showIf: { id: 'ec_migration', eq: 'Sí' } }
        ]
    },
    {
        key: 'app_mobile', pillar: 'dev', devTypes: ['app'], title: 'Aplicación móvil', icon: 'fa-mobile-screen',
        items: [
            { id: 'ap_platforms', label: 'Plataformas', type: 'checks', options: ['iOS (iPhone)', 'Android', 'Tablets', 'Versión web (PWA)'] },
            { id: 'ap_tech', label: 'Tecnología preferida', type: 'select', options: ['Recomendación de la agencia', 'Multiplataforma (Flutter / React Native)', 'Nativa (Swift / Kotlin)', 'PWA (app web instalable)'] },
            { id: 'ap_native', label: 'Funciones del dispositivo', type: 'checks', options: ['Notificaciones push', 'Cámara / galería', 'GPS / ubicación', 'Biometría (huella / Face ID)', 'Modo sin conexión', 'Pagos dentro de la app', 'Bluetooth / dispositivos', 'Calendario / contactos', 'Otro'] },
            { id: 'ap_login', label: 'Inicio de sesión', type: 'checks', options: ['Correo y contraseña', 'Google', 'Apple', 'Teléfono (SMS)', 'Sin inicio de sesión'] },
            { id: 'ap_backend', label: '¿Existe un backend / API que la app deba usar?', type: 'radio', options: ['Sí', 'No, hay que crearlo', 'No sé'] },
            { id: 'ap_backend_detail', label: 'Detalles del backend / API', type: 'textarea', showIf: { id: 'ap_backend', eq: 'Sí' } },
            { id: 'ap_store_accounts', label: 'Cuentas de desarrollador', type: 'checks', options: ['Apple Developer (activa)', 'Google Play Console (activa)', 'Aún no tenemos cuentas'] },
            { id: 'ap_publish', label: '¿Quién publica en las tiendas?', type: 'radio', options: ['La agencia', 'El cliente', 'Por definir'] },
            { id: 'ap_analytics', label: 'Analítica y monitoreo', type: 'checks', options: ['Firebase Analytics', 'Crashlytics', 'Mixpanel / Amplitude', 'Por definir'] }
        ]
    },
    {
        key: 'platform_scope', pillar: 'dev', devTypes: ['platform'], title: 'Plataforma / sistema', icon: 'fa-layer-group',
        items: [
            { id: 'pl_type', label: 'Modelo de la plataforma', type: 'select', options: ['Sistema interno de la empresa', 'SaaS (software por suscripción)', 'Portal de clientes', 'Intranet', 'Marketplace', 'Plataforma de cursos (LMS)', 'Otro'] },
            { id: 'pl_roles', label: 'Roles de usuario', type: 'repeater', fields: [{ k: 'role', label: 'Rol', placeholder: 'Ej. Administrador' }, { k: 'perms', label: '¿Qué puede hacer?', placeholder: 'Ver reportes, editar usuarios…' }], addLabel: 'Agregar rol', rowLabel: 'Rol' },
            { id: 'pl_modules', label: 'Módulos requeridos', type: 'checks', options: ['Dashboard / reportes', 'Gestión de usuarios', 'Inventarios', 'Facturación / CFDI', 'CRM / clientes', 'Agenda / reservas', 'Pagos / suscripciones', 'Mensajería / notificaciones', 'Gestor de documentos', 'API pública', 'Otro'] },
            { id: 'pl_integrations', label: 'Integraciones con otros sistemas', type: 'textarea', placeholder: 'ERP, CRM, contabilidad, pasarelas, APIs de terceros…' },
            { id: 'pl_volume', label: 'Usuarios activos esperados', type: 'select', options: ['Menos de 100', '100 – 1,000', '1,000 – 10,000', 'Más de 10,000'] },
            { id: 'pl_multitenant', label: '¿Varias empresas / sucursales usarán la misma plataforma?', type: 'radio', options: ['Sí', 'No'] },
            { id: 'pl_data_migration', label: '¿Hay datos que migrar?', type: 'radio', options: ['Sí', 'No'] },
            { id: 'pl_data_detail', label: '¿Qué datos y desde dónde?', type: 'textarea', showIf: { id: 'pl_data_migration', eq: 'Sí' } },
            { id: 'pl_security', label: 'Requisitos de seguridad', type: 'checks', options: ['Doble factor (2FA)', 'Roles y permisos granulares', 'Bitácora / auditoría de acciones', 'Cifrado de datos sensibles', 'Respaldos automáticos', 'Cumplimiento LFPDPPP'] }
        ]
    },
    {
        key: 'plat_erp', pillar: 'dev', devTypes: ['platform'], platKinds: ['erp'], title: 'ERP · Planeación de recursos', icon: 'fa-cubes', hasResponsible: true,
        desc: 'Inventario, compras, ventas, facturación y finanzas conectados en un solo sistema.',
        items: [
            { id: 'erp_pain', label: '¿Cuál es el mayor dolor operativo hoy?', type: 'textarea', placeholder: 'Ej. No sabemos el inventario real, facturar toma horas, cada área tiene su Excel…' },
            { id: 'erp_current', label: '¿Con qué controlan hoy la operación?', type: 'checks', options: ['Excel / hojas de cálculo', 'CONTPAQi', 'Aspel (SAE / COI / NOI)', 'SAP Business One', 'Odoo', 'Microsoft Dynamics', 'NetSuite', 'Sistema propio', 'Papel / libretas', 'Otro'] },
            { id: 'erp_modules', label: 'Módulos requeridos', type: 'checks', options: ['Finanzas y contabilidad', 'Inventarios y almacenes', 'Compras y proveedores', 'Ventas y cotizaciones', 'Facturación CFDI 4.0', 'Cuentas por cobrar / pagar', 'Producción / MRP', 'Punto de venta (POS)', 'Recursos humanos y nómina', 'Activos fijos', 'Proyectos y costos', 'Reportes / BI', 'Otro'] },
            { id: 'erp_solution', label: 'Enfoque de solución', type: 'radio', options: ['ERP comercial (Odoo, SAP B1, NetSuite…)', 'ERP a la medida', 'Híbrido (comercial + módulos propios)', 'Recomendación de la agencia'] },
            { id: 'erp_users', label: 'Usuarios que usarán el ERP', type: 'radio', options: ['1 – 5', '6 – 20', '21 – 50', '51 – 200', 'Más de 200'] },
            { id: 'erp_warehouses', label: 'Almacenes / sucursales a controlar', type: 'number', placeholder: 'Ej. 3', opt: true },
            { id: 'erp_special', label: 'Requisitos especiales', type: 'checks', options: ['Multi-empresa (varias razones sociales)', 'Multi-moneda', 'Multi-almacén', 'Lotes y números de serie', 'Caducidades', 'Códigos de barras / QR', 'Listas de materiales (BOM)', 'Costeo (promedio / PEPS)'], opt: true },
            { id: 'erp_sat', label: 'Facturación y SAT', type: 'checks', options: ['Timbrado CFDI 4.0', 'Complemento de pago', 'Carta porte', 'Nómina electrónica', 'Contabilidad electrónica', 'Aún no se factura'] },
            { id: 'erp_pac', label: 'PAC / proveedor de timbrado actual', type: 'text', placeholder: 'Ej. Facturama, SW Sapien, Finkok…', opt: true, showIf: { all: [{ id: 'erp_sat', filled: true }, { id: 'erp_sat', notHas: 'Aún no se factura' }] } },
            { id: 'erp_migration', label: 'Datos a migrar', type: 'checks', options: ['Catálogo de productos', 'Clientes', 'Proveedores', 'Saldos iniciales', 'Inventario inicial', 'Histórico de ventas', 'Nada'] },
            { id: 'erp_golive', label: 'Fecha deseada de arranque (go-live)', type: 'date', opt: true }
        ]
    },
    {
        key: 'plat_crm', pillar: 'dev', devTypes: ['platform'], platKinds: ['crm'], title: 'CRM · Ventas y clientes', icon: 'fa-handshake', hasResponsible: true,
        desc: 'Embudo de ventas, seguimiento automático y control de cada prospecto.',
        items: [
            { id: 'crm_goal', label: '¿Qué quieren lograr con el CRM?', type: 'checks', max: 3, desc: 'Máximo 3', options: ['Que no se pierda ningún prospecto', 'Seguimiento automático', 'Medir a los vendedores', 'Centralizar la base de clientes', 'Pronosticar ventas', 'Fidelizar / postventa'] },
            { id: 'crm_current', label: '¿Dónde viven hoy los prospectos?', type: 'checks', options: ['Excel', 'WhatsApp de cada vendedor', 'Correo', 'HubSpot', 'Salesforce', 'Zoho', 'Pipedrive', 'Kommo', 'En ningún lado', 'Otro'] },
            { id: 'crm_sources', label: 'Fuentes de prospectos', type: 'checks', options: ['Sitio web / formularios', 'WhatsApp', 'Meta Ads (Facebook / Instagram)', 'Google Ads', 'Llamadas', 'Referidos', 'Expos / eventos', 'Marketplaces', 'Otro'] },
            { id: 'crm_pipeline', label: 'Etapas del embudo de ventas', type: 'repeater', desc: 'Del primer contacto al cierre', fields: [{ k: 'stage', label: 'Etapa', placeholder: 'Ej. Cotización enviada' }, { k: 'exit', label: '¿Cuándo avanza?', placeholder: 'Ej. El cliente confirma' }], addLabel: 'Agregar etapa', rowLabel: 'Etapa', minRows: 3 },
            { id: 'crm_sellers', label: 'Vendedores / usuarios del CRM', type: 'radio', options: ['1 – 3', '4 – 10', '11 – 30', 'Más de 30'] },
            { id: 'crm_cycle', label: 'Ciclo de venta promedio', type: 'radio', options: ['Mismo día', '1 – 7 días', '1 – 4 semanas', '1 – 3 meses', 'Más de 3 meses'], opt: true },
            { id: 'crm_auto', label: 'Automatizaciones deseadas', type: 'checks', options: ['Asignación automática de leads', 'Recordatorios de seguimiento', 'WhatsApp automático', 'Secuencias de correo', 'Cotizaciones en PDF', 'Alertas de prospectos fríos', 'Encuestas de satisfacción'] },
            { id: 'crm_integr', label: 'Integraciones', type: 'checks', options: ['WhatsApp Business API', 'Gmail / Outlook', 'Calendario', 'ERP / facturación', 'Telefonía / call center', 'Formularios del sitio web', 'Meta Lead Ads'], opt: true },
            { id: 'crm_solution', label: 'Enfoque de solución', type: 'radio', options: ['CRM comercial (HubSpot, Zoho, Pipedrive…)', 'CRM a la medida', 'Recomendación de la agencia'] },
            { id: 'crm_reports', label: 'Reportes que necesitan ver', type: 'textarea', placeholder: 'Ventas por vendedor, tasa de cierre, tiempo de respuesta…', opt: true }
        ]
    },
    {
        key: 'plat_custom', pillar: 'dev', devTypes: ['platform'], platKinds: ['custom'], title: 'Plataforma personalizada', icon: 'fa-wand-magic-sparkles', hasResponsible: true,
        desc: 'Software a la medida: definimos el problema, el flujo y qué entra en la primera versión.',
        items: [
            { id: 'cu_problem', label: '¿Qué problema único resolverá?', type: 'textarea', placeholder: 'Lo que hoy no resuelve ningún sistema comercial' },
            { id: 'cu_flow', label: 'Flujo principal paso a paso', type: 'textarea', placeholder: '1. El cliente solicita…\n2. El área X revisa…\n3. …' },
            { id: 'cu_features', label: 'Funciones y prioridad', type: 'repeater', desc: 'Lo que entra al MVP vs. fases siguientes', fields: [{ k: 'feature', label: 'Función', placeholder: 'Ej. Alta de pedidos' }, { k: 'prio', label: 'Prioridad', placeholder: 'MVP / Fase 2 / Fase 3' }], addLabel: 'Agregar función', rowLabel: 'Función', minRows: 3 },
            { id: 'cu_channels', label: '¿Dónde se usará?', type: 'checks', options: ['Navegador (web)', 'App móvil', 'Tablet en piso / mostrador', 'Kiosko', 'Integrado a otro sistema'] },
            { id: 'cu_ai', label: '¿Integrar inteligencia artificial?', type: 'checks', options: ['Asistente / chatbot', 'Lectura de documentos (OCR)', 'Clasificación automática', 'Predicciones / pronósticos', 'No por ahora'] },
            { id: 'cu_entities', label: 'Datos principales que maneja', type: 'textarea', placeholder: 'Clientes, pedidos, unidades, contratos…', opt: true },
            { id: 'cu_stack', label: 'Preferencia tecnológica', type: 'select', options: ['Recomendación de la agencia', 'JavaScript / Node.js', 'Python', 'PHP / Laravel', '.NET', 'Low-code', 'Otro'], opt: true },
            { id: 'cu_hosting', label: 'Infraestructura', type: 'select', options: ['Nube administrada por la agencia', 'Nube del cliente (AWS / Azure / GCP)', 'Servidor propio (on-premise)', 'Por definir'], opt: true },
            { id: 'cu_ownership', label: 'Propiedad del código', type: 'radio', options: ['Del cliente (entrega de repositorio)', 'Licencia de uso', 'Por definir'], opt: true },
            { id: 'cu_support', label: 'Soporte posterior al lanzamiento', type: 'radio', options: ['Póliza mensual', 'Por evento', 'Equipo interno del cliente', 'Por definir'] }
        ]
    },
    {
        key: 'web_performance', pillar: 'dev', devTypes: ['web', 'platform'], kind: 'audit', title: 'Rendimiento', icon: 'fa-gauge-high', hasResponsible: true,
        showIf: { id: 'dv_stage', in: ['Rediseño / mejora de algo existente', 'Migración de plataforma'] },
        lockedHint: 'Aplica a proyectos existentes. Se habilita al elegir "Rediseño" o "Migración" en Alcance del proyecto.',
        lockedGoto: 'dev_scope',
        items: [
            { id: 'web_development_7', label: 'Core Web Vitals', desc: 'LCP, INP, CLS.' },
            { id: 'web_development_8', label: 'Caché', desc: 'Servidor y página.' },
            { id: 'web_development_9', label: 'DOM', desc: 'Menos de 1,500 nodos.' },
            { id: 'web_development_10', label: 'Imágenes', desc: 'WebP / AVIF, dimensiones explícitas.' },
            { id: 'web_development_11', label: 'Lazy loading', desc: 'Carga diferida fuera del viewport.' },
            { id: 'web_development_12', label: 'Scripts', desc: 'GTM centralizado, sin scripts bloqueantes.' }
        ]
    },
    {
        key: 'web_seo', pillar: 'dev', devTypes: ['web'], kind: 'audit', title: 'SEO técnico', icon: 'fa-magnifying-glass-chart', hasResponsible: true,
        items: [
            { id: 'ws_index', label: 'Indexación', desc: 'Páginas útiles vs. páginas basura.' },
            { id: 'ws_h1', label: 'Encabezados', desc: 'Jerarquía H1–H6.' },
            { id: 'ws_links', label: 'Enlazado interno', desc: 'Sin páginas huérfanas.' },
            { id: 'ws_404', label: 'Errores 404 / 301', desc: 'Redirecciones limpias.' },
            { id: 'ws_sitemap', label: 'Sitemap / robots', desc: 'Declarados en Google Search Console.' },
            { id: 'ws_schema', label: 'Datos estructurados', desc: 'Schema markup.' },
            { id: 'ws_mobile', label: 'Mobile-first', desc: 'Contenido de valor visible en móvil.' }
        ]
    },
    {
        key: 'web_cro', pillar: 'dev', devTypes: ['web', 'platform'], kind: 'audit', title: 'Conversión (CRO)', icon: 'fa-filter-circle-dollar', hasResponsible: true,
        items: [
            { id: 'wc_forms', label: 'Formularios', desc: 'Mínima fricción.' },
            { id: 'wc_funnels', label: 'Embudos', desc: 'GA4: medición de clics clave.' },
            { id: 'wc_cta', label: 'CTAs', desc: 'Jerarquía visual clara.' },
            { id: 'wc_crm', label: 'CRM', desc: 'Integración de leads.' },
            { id: 'wc_social', label: 'Prueba social', desc: 'Testimonios visibles.' },
            { id: 'wc_magnet', label: 'Lead magnets', desc: 'Captación de correos.' },
            { id: 'wc_search', label: 'Buscador interno', desc: 'Tolerancia a errores.' }
        ]
    },
    {
        key: 'app_audit', pillar: 'dev', devTypes: ['app'], kind: 'audit', title: 'Diagnóstico de la app actual', icon: 'fa-stethoscope', hasResponsible: true,
        showIf: { id: 'dv_stage', in: ['Rediseño / mejora de algo existente', 'Migración de plataforma'] },
        lockedHint: 'Aplica a apps existentes. Se habilita al elegir "Rediseño" o "Migración" en Alcance del proyecto.',
        lockedGoto: 'dev_scope',
        items: [
            { id: 'aa_rating', label: 'Calificación en tiendas', desc: 'Promedio y reseñas recientes en App Store / Google Play.' },
            { id: 'aa_crashes', label: 'Estabilidad', desc: 'Tasa de cierres inesperados (crash-free users).' },
            { id: 'aa_speed', label: 'Tiempo de arranque', desc: 'Menos de 2 segundos en arranque en frío.' },
            { id: 'aa_size', label: 'Tamaño de la app', desc: 'Peso de descarga razonable.' },
            { id: 'aa_os', label: 'Compatibilidad', desc: 'Soporte de versiones recientes de iOS / Android.' },
            { id: 'aa_perms', label: 'Permisos', desc: 'Solo los necesarios y bien explicados.' },
            { id: 'aa_a11y', label: 'Accesibilidad', desc: 'Tamaño dinámico de texto y lector de pantalla.' },
            { id: 'aa_updates', label: 'Actualizaciones', desc: 'Frecuencia y proceso de publicación.' }
        ]
    },
    {
        key: 'platform_audit', pillar: 'dev', devTypes: ['platform'], kind: 'audit', title: 'Diagnóstico técnico de plataforma', icon: 'fa-microchip', hasResponsible: true,
        showIf: { id: 'dv_stage', in: ['Rediseño / mejora de algo existente', 'Migración de plataforma'] },
        lockedHint: 'Aplica a sistemas existentes. Se habilita al elegir "Rediseño" o "Migración" en Alcance del proyecto.',
        lockedGoto: 'dev_scope',
        items: [
            { id: 'pa_arch', label: 'Arquitectura y escalabilidad', desc: 'Soporta el crecimiento esperado.' },
            { id: 'pa_db', label: 'Base de datos', desc: 'Modelo, índices y respaldos.' },
            { id: 'pa_api', label: 'API', desc: 'Documentada y versionada.' },
            { id: 'pa_auth', label: 'Autenticación', desc: 'Sesiones seguras, 2FA, recuperación de cuenta.' },
            { id: 'pa_logs', label: 'Logs y monitoreo', desc: 'Alertas de errores y caídas.' },
            { id: 'pa_cicd', label: 'Despliegue (CI/CD)', desc: 'Automatizado y con reversión.' },
            { id: 'pa_tests', label: 'Pruebas automatizadas', desc: 'Cobertura de flujos críticos.' },
            { id: 'pa_docs', label: 'Documentación técnica', desc: 'Actualizada y accesible.' }
        ]
    },
    {
        key: 'web_security', pillar: 'dev', kind: 'audit', title: 'Seguridad y legal', icon: 'fa-shield-halved', hasResponsible: true,
        items: [
            { id: 'wsec_privacy', label: 'Aviso de privacidad', desc: 'Derechos ARCO.' },
            { id: 'wsec_cookies', label: 'Cookies', desc: 'Consentimiento real.', devTypes: ['web', 'platform'] },
            { id: 'wsec_terms', label: 'Términos y condiciones', desc: 'Políticas claras.' },
            { id: 'wsec_spam', label: 'Antispam', desc: 'reCAPTCHA v3 / Turnstile.', devTypes: ['web', 'platform'] },
            { id: 'wsec_waf', label: 'WAF', desc: 'Bloqueo de fuerza bruta.', devTypes: ['web', 'platform'] },
            { id: 'wsec_perms', label: 'Permisos', desc: 'Roles limitados.' },
            { id: 'wsec_files', label: 'Archivos sensibles', desc: 'Bloqueo de directorios.', devTypes: ['web', 'platform'] },
            { id: 'wsec_store', label: 'Políticas de tiendas', desc: 'Cumplimiento App Store / Google Play.', devTypes: ['app'] }
        ]
    },

    // ===================== OPERACIONES =====================
    {
        key: 'ops_overview', pillar: 'ops', title: 'Operación actual', icon: 'fa-gears', hasResponsible: true,
        desc: 'Cómo funciona hoy la empresa por dentro.',
        items: [
            { id: 'op_model', label: 'Tipo de operación', type: 'checks', options: ['Venta de productos', 'Prestación de servicios', 'Manufactura / producción', 'Distribución / mayoreo', 'Retail / tiendas', 'Proyectos', 'Otro'] },
            { id: 'op_staff', label: 'Número de colaboradores', type: 'radio', options: ['1 – 10', '11 – 50', '51 – 200', 'Más de 200'] },
            { id: 'op_areas', label: 'Áreas de la empresa', type: 'checks', options: ['Dirección', 'Ventas', 'Compras', 'Almacén', 'Producción', 'Logística', 'Administración / finanzas', 'RRHH', 'Atención a clientes', 'Marketing', 'Sistemas / TI'], opt: true },
            { id: 'op_flow', label: 'Del pedido al cobro: ¿cómo fluye?', type: 'textarea', placeholder: '1. Llega el pedido por…\n2. Se surte desde…\n3. Se factura y cobra…' },
            { id: 'op_bottleneck', label: 'Principales cuellos de botella', type: 'checks', options: ['Información regada (Excel, WhatsApp…)', 'Retrabajos y errores manuales', 'Inventario poco confiable', 'Entregas tardías', 'Cobranza lenta', 'Falta de reportes', 'Dependencia de personas clave', 'Comunicación entre áreas', 'Otro'] },
            { id: 'op_tools', label: 'Herramientas que usan hoy', type: 'checks', options: ['Excel / Google Sheets', 'WhatsApp', 'Correo', 'ERP', 'CRM', 'CONTPAQi / Aspel', 'Trello / Asana / Monday', 'Google Workspace', 'Microsoft 365', 'Otro'] },
            { id: 'op_hours', label: 'Horas a la semana en tareas repetitivas', type: 'radio', options: ['Menos de 5', '5 – 15', '15 – 40', 'Más de 40', 'No lo sabemos'], opt: true },
            { id: 'op_hours_detail', label: '¿Qué tareas consumen ese tiempo?', type: 'textarea', opt: true, showIf: { id: 'op_hours', in: ['5 – 15', '15 – 40', 'Más de 40'] } }
        ]
    },
    {
        key: 'ops_audit', pillar: 'ops', kind: 'audit', title: 'Madurez operativa', icon: 'fa-list-check', hasResponsible: true,
        items: [
            { id: 'op_a_sop', label: 'Procesos documentados', desc: 'Manuales / SOPs actualizados y accesibles.' },
            { id: 'op_a_org', label: 'Organigrama y roles', desc: 'Responsabilidades claras por puesto.' },
            { id: 'op_a_kpi', label: 'Indicadores (KPIs)', desc: 'Metas medibles y revisadas periódicamente.' },
            { id: 'op_a_inv', label: 'Control de inventario', desc: 'Existencias confiables y conteos cíclicos.' },
            { id: 'op_a_buy', label: 'Compras y proveedores', desc: 'Autorizaciones y proveedores evaluados.' },
            { id: 'op_a_log', label: 'Logística y entregas', desc: 'Rutas, tiempos y rastreo de pedidos.' },
            { id: 'op_a_bill', label: 'Facturación y cobranza', desc: 'Facturas a tiempo y cartera controlada.' },
            { id: 'op_a_qa', label: 'Control de calidad', desc: 'Revisión antes de entregar al cliente.' },
            { id: 'op_a_cx', label: 'Servicio y postventa', desc: 'Quejas, garantías y seguimiento.' },
            { id: 'op_a_train', label: 'Capacitación / onboarding', desc: 'Personal nuevo productivo rápido.' },
            { id: 'op_a_data', label: 'Información centralizada', desc: 'Una sola fuente de verdad, sin Excel dispersos.' }
        ]
    },
    {
        key: 'ops_kpis', pillar: 'ops', title: 'Indicadores y reportes', icon: 'fa-chart-line',
        items: [
            { id: 'op_k_list', label: 'KPIs que miden hoy', type: 'checks', options: ['Ventas', 'Margen / utilidad', 'Flujo de efectivo', 'Rotación de inventario', 'Tiempo de entrega', 'Satisfacción del cliente (NPS)', 'Productividad por empleado', 'Cartera vencida', 'Ninguno'] },
            { id: 'op_k_freq', label: '¿Cada cuánto los revisan?', type: 'radio', options: ['Diario', 'Semanal', 'Mensual', 'Cuando se puede'] },
            { id: 'op_k_dash', label: '¿Cómo se ven los reportes?', type: 'radio', options: ['Dashboard en tiempo real', 'Excel armado a mano', 'Reporte del contador', 'No hay reportes'] },
            { id: 'op_k_goal', label: 'Meta principal a 12 meses', type: 'textarea', placeholder: 'Ej. Crecer 30% sin contratar más personal administrativo' }
        ]
    },
    {
        key: 'ops_automation', pillar: 'ops', title: 'Automatización y mejora', icon: 'fa-robot',
        items: [
            { id: 'op_au_wish', label: 'Procesos que les gustaría automatizar', type: 'checks', options: ['Cotizaciones', 'Pedidos', 'Facturación', 'Cobranza / recordatorios de pago', 'Inventario y reabasto', 'Reportes', 'Atención por WhatsApp', 'Agenda / citas', 'Aprobaciones internas', 'Onboarding de personal', 'Otro'] },
            { id: 'op_au_priority', label: 'Si solo pudieran arreglar una cosa este trimestre, ¿cuál sería?', type: 'textarea' },
            { id: 'op_au_change', label: 'Disposición del equipo al cambio', type: 'radio', options: ['Alta', 'Media', 'Baja / hay resistencia'], opt: true },
            { id: 'op_au_budget', label: 'Inversión contemplada en mejora operativa', type: 'select', options: ['Por definir', 'Menos de $50,000 MXN', '$50,000 – $150,000 MXN', '$150,000 – $500,000 MXN', 'Más de $500,000 MXN'], opt: true }
        ]
    },

    // ===================== REDES SOCIALES =====================
    {
        key: 'social_antecedentes', pillar: 'social', title: 'Antecedentes y diagnóstico', icon: 'fa-clock-rotate-left', hasResponsible: true,
        desc: 'Solo la primera vez o en cambio de estrategia.',
        items: [
            { id: 'sa_ads_prev', label: '¿Se han hecho campañas pagadas (Ads)?', type: 'radio', options: ['Sí', 'No'] },
            { id: 'sa_platforms', label: '¿En qué plataformas?', type: 'checks', options: ['Facebook Ads', 'Instagram', 'Google Ads', 'TikTok', 'Otra'], showIf: { id: 'sa_ads_prev', eq: 'Sí' } },
            { id: 'sa_investment', label: 'Inversión aproximada mensual', type: 'text', placeholder: '$0,000 MXN', showIf: { id: 'sa_ads_prev', eq: 'Sí' } },
            { id: 'sa_geo', label: '¿Se usó segmentación por ubicación?', type: 'radio', options: ['Sí', 'No'], showIf: { id: 'sa_ads_prev', eq: 'Sí' } },
            { id: 'sa_geo_detail', label: 'Radio o zonas que abarcaba', type: 'text', placeholder: 'Ej. 5 km a la redonda, colonias X, Y', showIf: { id: 'sa_geo', eq: 'Sí' } },
            { id: 'sa_format', label: 'Formatos que mejor funcionan', type: 'checks', options: ['Video corto (Reels / TikTok)', 'Imágenes estáticas (producto)', 'Carruseles (informativos)', 'Memes / humor', 'Fotos de personas / equipo'] },
            { id: 'sa_format_detail', label: '¿Qué tipo de video?', type: 'text', showIf: { id: 'sa_format', has: 'Video corto (Reels / TikTok)' } }
        ]
    },
    {
        key: 'social_objetivos', pillar: 'social', title: 'Objetivos del mes', icon: 'fa-bullseye',
        items: [
            { id: 'so_focus', label: 'Prioridad para este mes', type: 'checks', max: 2, desc: 'Máximo 2', options: ['Venta directa (push de producto)', 'Branding / reconocimiento', 'Interacción (comunidad)', 'Lanzamiento de algo nuevo', 'Fechas especiales'] },
            { id: 'so_products', label: 'Productos / servicios estrella', type: 'repeater', fields: [{ k: 'name', label: 'Producto / servicio' }, { k: 'discount', label: 'Descuento', placeholder: 'Ej. 15% o sin descuento' }], addLabel: 'Agregar producto', rowLabel: 'Producto', minRows: 1 },
            { id: 'so_seasonal', label: '¿Manejan descuentos por temporada?', type: 'radio', options: ['Sí', 'No'] },
            { id: 'so_seasonal_detail', label: '¿Qué descuentos y en qué temporadas?', type: 'textarea', showIf: { id: 'so_seasonal', eq: 'Sí' } }
        ]
    },
    {
        key: 'social_insumos', pillar: 'social', title: 'Insumos para parrilla', icon: 'fa-table-cells',
        items: [
            { id: 'si_posts', label: 'Publicaciones al mes', type: 'number', placeholder: '13' },
            { id: 'si_news', label: 'Noticias y novedades', type: 'textarea', desc: 'Eventos, cambios de horario, contrataciones o avisos.' },
            { id: 'si_edu', label: 'Contenido educativo / de valor', type: 'textarea', desc: '¿Qué preguntas hacen mucho los clientes últimamente?' },
            { id: 'si_testimonials', label: '¿Tienes testimonios o reseñas?', type: 'radio', options: ['Sí, los adjuntaré', 'No, este mes no'], upload: { showIf: { id: 'si_testimonials', eq: 'Sí, los adjuntaré' }, hint: 'Sube capturas de testimonios' } },
            { id: 'si_visuals', label: '¿Cuentas con fotos / videos nuevos?', type: 'select', options: ['Sí, ya están en la carpeta compartida', 'No, usen fotos de stock', 'No, requiero agendar visita para fotos / video'] },
            { id: 'si_visit_date', label: 'Fecha sugerida para la visita', type: 'date', showIf: { id: 'si_visuals', eq: 'No, requiero agendar visita para fotos / video' } },
            { id: 'si_contact_type', label: 'Contacto a incluir en el contenido', type: 'checks', options: ['Número telefónico', 'WhatsApp', 'Correo electrónico', 'Página web'] }
        ]
    },
    {
        key: 'social_ads', pillar: 'social', title: 'Pauta publicitaria (Ads)', icon: 'fa-bullhorn',
        items: [
            { id: 'sad_active', label: '¿Este mes se invertirá en publicidad pagada?', type: 'radio', options: ['Sí', 'No'] },
            { id: 'sad_focus', label: 'Enfoque de las campañas', type: 'checks', options: ['Productos', 'Valor de marca (branding)', 'Marca en general', 'Generación de leads'], showIf: { id: 'sad_active', eq: 'Sí' } },
            { id: 'sad_budget', label: 'Presupuesto de pauta este mes', type: 'text', placeholder: '$0,000 MXN', showIf: { id: 'sad_active', eq: 'Sí' } },
            { id: 'sad_target', label: '¿A quién mostraremos los anuncios este mes?', type: 'textarea', desc: 'Segmentación para este periodo', showIf: { id: 'sad_active', eq: 'Sí' } },
            { id: 'sad_geo', label: 'Ubicación geográfica', type: 'textarea', placeholder: 'Ciudad, colonia o radio en km', showIf: { id: 'sad_active', eq: 'Sí' } }
        ]
    },
    {
        key: 'social_formato', pillar: 'social', title: 'Preferencias de formato', icon: 'fa-sliders',
        items: [
            { id: 'sf_pref', label: '¿Hacia qué formato inclinar la balanza?', type: 'radio', options: ['Más video (Reels)', 'Más estático (diseño gráfico)', 'Más informativo (carruseles)', 'Balanceado (recomendación de la agencia)'] },
            { id: 'sf_comments', label: 'Comentarios o restricciones', type: 'textarea', placeholder: 'Ej. "No publicar el día 15", "Usar más azul este mes"' }
        ]
    },
    {
        key: 'social_disponibilidad', pillar: 'social', title: 'Disponibilidad', icon: 'fa-calendar-check', hasResponsible: true,
        items: [
            { id: 'sd_approval_days', label: 'Días hábiles para aprobar cada entrega', type: 'days' },
            { id: 'sd_visits', label: '¿Disponibilidad para visitas de fotos / video (2–3 días de anticipación)?', type: 'radio', options: ['Sí', 'No', 'Especifique otro'] },
            { id: 'sd_security', label: '¿Se requiere supervisor de seguridad durante la sesión?', type: 'radio', options: ['Sí', 'No'] }
        ]
    },

    // ===================== ADICIONALES =====================
    {
        key: 'on_demand', pillar: 'extra', kind: 'audit', title: 'Material bajo demanda', icon: 'fa-pen-fancy', hasResponsible: true,
        items: [
            { id: 'on_demand_0', label: 'Solicitud clara', desc: '¿Tiene medidas, formato y objetivo?' },
            { id: 'on_demand_1', label: 'Manual de marca', desc: '¿Se apega a los lineamientos gráficos?' },
            { id: 'on_demand_2', label: 'Ortografía y redacción', desc: '¿Textos revisados y aprobados?' },
            { id: 'on_demand_3', label: 'Imágenes de alta', desc: '¿Recursos con calidad para impresión / web?' },
            { id: 'on_demand_4', label: 'Formatos de entrega', desc: '¿Editables o solo finales?' },
            { id: 'on_demand_5', label: 'Tiempos de entrega', desc: '¿Fecha límite realista acordada?' },
            { id: 'on_demand_6', label: 'Canal de difusión', desc: '¿Imprenta, digital o gran formato?' }
        ]
    }
];

// Preguntas de detalle: se ocultan en "Modo exprés" (si no tienen respuesta).
const OPTIONAL_IDS = [
    'bg_legal', 'bg_slogan', 'bg_contact_role', 'bg_phone_corp', 'bg_phone_sales', 'bg_who', 'bg_mission', 'bg_vision', 'bg_values', 'bg_founded', 'bg_branches', 'bg_security_note',
    'bn_contact', 'bn_personnel_days', 'bm_comments', 'bc_detail', 'bc_pages', 'bc_ondemand_note', 'bdel_comments',
    'dv_refs', 'dv_content', 'ec_categories', 'ec_migration_from', 'ap_analytics', 'ap_publish', 'pl_multitenant', 'pl_volume',
    'web_infrastructure_3', 'web_infrastructure_7', 'web_uiux_5', 'web_uiux_6', 'web_uiux_7', 'ws_schema', 'wc_magnet', 'wc_search',
    'aa_size', 'aa_updates', 'pa_tests', 'pa_docs',
    'sa_geo', 'sa_geo_detail', 'sa_format_detail', 'sf_comments', 'sd_security'
];
SECTIONS.forEach(s => s.items.forEach(i => { if (OPTIONAL_IDS.includes(i.id)) i.opt = true; }));

export const SECTION_MAP = Object.fromEntries(SECTIONS.map(s => [s.key, s]));
export const ITEM_MAP = {};
SECTIONS.forEach(s => s.items.forEach(i => { if (i.id) ITEM_MAP[i.id] = { ...i, section: s.key }; }));

export const VISUAL_STYLES = [
    { val: 'Tipográfico', img: 'assets/styles/tipografico.png', desc: 'Solo texto, la fuerza está en la fuente (ej. Google)' },
    { val: 'Isologo / imagotipo', img: 'assets/styles/isologo.png', desc: 'Ícono + texto (ej. Adidas)' },
    { val: 'Emblema', img: 'assets/styles/emblema.png', desc: 'Texto dentro de una forma (ej. Starbucks)' }
];

export const isOtherOption = o => /^(otro|otra|especifique)/i.test(o);
