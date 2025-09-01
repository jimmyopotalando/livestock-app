import logging
import os

def setup_logger(name, log_file=None, level=logging.INFO):
    """
    Set up a logger with the given name.
    Logs to console and optionally to a file.
    """
    formatter = logging.Formatter('%(asctime)s [%(levelname)s] %(name)s - %(message)s')

    handler_list = []

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    handler_list.append(console_handler)

    # File handler (optional)
    if log_file:
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(formatter)
        handler_list.append(file_handler)

    logger = logging.getLogger(name)
    logger.setLevel(level)

    # Avoid adding multiple handlers if logger is called multiple times
    if not logger.handlers:
        for handler in handler_list:
            logger.addHandler(handler)

    return logger
