import os

from twisted.trial import unittest

from openwallet.util.misc import find_value, hexdump


class TestMiscUtil(unittest.TestCase):

    def test_find_value(self):
        with open(os.path.join('data', 'http_response.txt'), 'rb') as fp:
            html = fp.read()

        self.assertEqual(find_value(html, '<link href="style.css" rel="'), 'stylesheet')

    def test_find_value_special_char(self):
        with open(os.path.join('data', 'http_response.txt'), 'rb') as fp:
            html = fp.read()

        self.assertEqual(find_value(html, '<link href="style.css" rel="', special_char=' '), 'stylesheet"')

    def test_find_value_num_chars(self):
        with open(os.path.join('data', 'http_response.txt'), 'rb') as fp:
            html = fp.read()

        self.assertEqual(find_value(html, '<link href="style.css" rel="', num_chars=5), 'sheet')

    def test_find_value_no_result(self):
        self.assertEqual(find_value('texttofin', 'texttofind'), None)

    def test_find_value_empty_document(self):
        self.assertEqual(find_value('', 'texttofind'), None)

    def test_find_value_empty_query(self):
        self.assertEqual(find_value('texttofind', ''), None)

    def test_find_value_bad_offset(self):
        self.assertEqual(find_value('texttofind', 'texttofind', num_chars=100), None)

    def test_hexdump(self):
        input = ''.join([chr(i) for i in range(50)])
        output = '00000000:  00 01 02 03 04 05 06 07  08 09 0a 0b 0c 0d 0e 0f  |................|\n' + \
                 '00000010:  10 11 12 13 14 15 16 17  18 19 1a 1b 1c 1d 1e 1f  |................|\n' + \
                 '00000020:  20 21 22 23 24 25 26 27  28 29 2a 2b 2c 2d 2e 2f  |.!"#$%&\'()*+,-./|\n' + \
                 '00000030:  30 31                                             |01|\n'
        self.assertEqual(hexdump(input), output)
        self.assertEqual(hexdump(''), '')
