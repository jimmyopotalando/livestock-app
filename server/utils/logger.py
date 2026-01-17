import logging
import os

def setup_logger(name, log_file=None, level=logging.INFO):
    """
    Set up and return a logger with the given name.

    - Always logs to console
    - Optionally logs to a file
    - Prevents duplicate handlers if called multiple times
    """
    formatter = logging.Formatter(
        '%(asctime)s [%(levelname)s] %(name)s - %(message)s'
    )

    logger = logging.getLogger(name)
    logger.setLevel(level)

    # Prevent log duplication from root logger
    logger.propagate = False

    # Avoid adding handlers multiple times
    if logger.handlers:
        return logger

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # File handler (optional)
    if log_file:
        log_dir = os.path.dirname(log_file)
        if log_dir:
            os.makedirs(log_dir, exist_ok=True)

        file_handler = logging.FileHandler(log_file, encoding='utf-8')
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

    return logger
