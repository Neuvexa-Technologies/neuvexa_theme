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

# Override ERPNext's reserved portal routes (/invoices, /quotations) so the
# Neuvexa NAT-style pages win. Route rules are evaluated before the built-in
# portal/template pages, and point to uniquely-named www pages only this app has.
website_route_rules = [
    {"from_route": "/invoices", "to_route": "neuvexa_invoices"},
    {"from_route": "/quotations", "to_route": "neuvexa_quotations"},
]
