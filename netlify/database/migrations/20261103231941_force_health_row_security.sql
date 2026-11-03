-- Also enforce policies for the table owner used by the server adapter.
ALTER TABLE health_records FORCE ROW LEVEL SECURITY;
REVOKE ALL ON health_records, app_sessions, request_limits FROM PUBLIC;
