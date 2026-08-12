"""Configuration du projet.

Le projet tourne sur MySQL. On utilise `mysqlclient` quand il est installe,
sinon on retombe sur `PyMySQL` (plus simple a installer sous Windows/Colab).
"""

try:  # pragma: no cover
    import MySQLdb  # noqa: F401
except ImportError:  # pragma: no cover
    try:
        import pymysql

        pymysql.install_as_MySQLdb()
    except ImportError:
        pass
