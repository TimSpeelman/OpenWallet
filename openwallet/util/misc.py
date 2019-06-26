import string


# source: https://gist.github.com/JonathonReinhart/509f9a8094177d050daa84efcd4486cb
def hexdump(src, length=16, sep='.'):
    DISPLAY = string.digits + string.letters + string.punctuation
    FILTER = ''.join(((x if x in DISPLAY else '.') for x in map(chr, range(256))))
    lines = []
    for c in xrange(0, len(src), length):
        chars = src[c:c+length]
        hex = ' '.join(["%02x" % ord(x) for x in chars])
        if len(hex) > 24:
            hex = "%s %s" % (hex[:24], hex[24:])
        printable = ''.join(["%s" % FILTER[ord(x)] for x in chars])
        lines.append("%08x:  %-*s  |%s|\n" % (c, length*3, hex, printable))
    return ''.join(lines)


def find_value(html, key, num_chars=0, special_char='"'):
    pos_begin = html.find(key)
    if pos_begin == -1:
        return
    pos_begin += len(key) + num_chars
    pos_end = html.find(special_char, pos_begin)
    return html[pos_begin: pos_end] if pos_end != -1 else None
