app_name = "neuvexa_theme"
app_title = "Neuvexa Theme"
app_publisher = "Neuvexa Technologies LLC"
app_description = "Neuvexa branding + NAT-style theme for Neuvexa ERP (desk + portal)."
app_email = "developer@neuvexa.ae"
app_license = "MIT"

# Load the Neuvexa theme CSS on the desk (/app) and on portal/website pages
app_include_css = "/assets/neuvexa_theme/css/neuvexa_theme.css"
web_include_css = "/assets/neuvexa_theme/css/neuvexa_theme.css"

# Navbar / app logo (Neuvexa ERP lockup)
app_logo_url = "/assets/neuvexa_theme/images/neuvexa_erp_logo.svg"

# ERPNext reserves the portal routes /invoices and /quotations (its built-in
# customer-portal list pages), which override any www page of the same name.
# website_redirects are resolved before page lookup, so these send the reserved
# routes to the Neuvexa NAT-style pages, which live at non-reserved routes.
website_redirects = [
    {"source": "/invoices", "target": "/neuvexa_invoices"},
    {"source": "/quotations", "target": "/neuvexa_quotations"},
]
