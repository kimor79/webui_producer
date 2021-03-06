<?php

/*

Copyright (c) 2012, Kimo Rosenbaum and contributors
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the owner nor the names of its contributors
      may be used to endorse or promote products derived from this
      software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/

/**
 * WebUIProducerV2
 * @author Kimo Rosenbaum <kimor79@yahoo.com>
 * @version $Id$
 * @package WebUIProducerV2Base
 */

class WebUIProducerV2Base {

	protected $config = array(
		'base_urn' => '/',
	);

	public function __construct($options = array()) {
		$file = '';
		$var = '';

		if(!defined('WEBUI_PRODUCER_MYAPP')) {
			throw new Exception('WEBUI_PRODUCER_MYAPP not defined');
		}

		$var = WEBUI_PRODUCER_MYAPP . '_CONFIG_FILE';
		$var = strtoupper($var);

		if(!array_key_exists($var, $_SERVER)) {
			throw new Exception(
				sprintf("\$_SERVER['%s'] not defined", $var));
		}

		$file = $_SERVER[$var];

		$config = parse_ini_file($file, true);
		if(!is_array($config)) {
			throw new Exception('Unable to parse ' . $file);
		}

		$this->config = array_merge($this->config, $config);

		$this->config['base_urn'] = trim($this->config['base_urn'],
			'/');

		if($this->config['base_urn'] === '') {
			$this->config['base_urn'] = '/';
		} else {
			$this->config['base_urn'] = sprintf("/%s/",
				$this->config['base_urn']);
		}

		if(!array_key_exists('base_url', $this->config)) {
			$this->config['base_url'] = $this->buildSelfURL();
		}
	}

	public function __deconstruct() {
	}

	/**
	 * Build a base url pointing to one's self
	 * @return string
	 */
	protected function buildSelfURL() {
		$scheme = 'http';
		$path = '';
		$port = '';

		if(isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] == 'on') {
			$scheme .= 's';
		}

		if(isset($_SERVER['SERVER_PORT']) &&
				$_SERVER['SERVER_PORT'] != 80 &&
				$_SERVER['SERVER_PORT'] != 443) {
			$port = ':' . $_SERVER['SERVER_PORT'];
		}

		return sprintf("%s://%s%s/",
			$scheme, $_SERVER['HTTP_HOST'], $port);
	}

	/**
	 * Build uri (base_urn + input)
	 * @param string $path
	 * @return string
	 */
	public function buildSelfURN($path = '') {
		return $this->config['base_urn'] . ltrim($path, '/');
	}

	/**
	 * Build a uri based on a subsection of config
	 * @param string $section
	 * @return string
	 */
	public function buildURI($section = '') {
		$base_url = $this->getConfig('base_url');
		$base_urn = $this->getConfig('base_urn');

		if($section) {
			$t_uri = $this->getConfig($section, 'base_uri');
			if(!is_null($t_uri)) {
				return $t_uri;
			}

			$t_url = $this->getConfig($section, 'base_url');
			if(!is_null($t_url)) {
				$base_url = $t_url;
			}

			$t_urn = $this->getConfig($section, 'base_urn');
			if(!is_null($t_urn)) {
				$base_urn = $t_urn;
			}
		}

		return rtrim($base_url, '/') . '/' . ltrim($base_urn, '/');
	}

	/**
	 * Get a config option
	 * @param string $key
	 * @param string $sub optional sub key
	 * @return mixed
	 */
	public function getConfig($key, $sub = '') {
		if(array_key_exists($key, $this->config)) {
			if(empty($sub)) {
				return $this->config[$key];
			} else {
				if(is_array($this->config[$key]) &&
						array_key_exists($sub,
							$this->config[$key])) {
					return $this->config[$key][$sub];
				}
			}
		}

		return NULL;
	}

	/**
	 * do the array_key_exists dance for $_GET
	 * @param string $key
	 * @return mixed
	 */
	public function getGET($key) {
		if(array_key_exists($key, $_GET)) {
			return $_GET[$key];
		}

		return '';
	}

	/**
	 * Give 302
	 * @param string $path relative path
	 * @param int $status status code, default is 302
	 */
	public function giveRedirect($path = '', $status = 302) {
		$location = $this->buildURI() . ltrim($path, '/');

		header('Status: ' . $status);
		header('Location: ' . $location);
	}

	/**
	 * Show css links
	 * @param array $urls
	 */
	public function showCSSLinks($urls = array()) {
		if(empty($urls)) {
			return;
		}

		while(list($junk, $url) = each($urls)) {
			echo '<link rel="stylesheet" type="text/css" ';
			printf("href=\"%s\">\n", $url);
		}
		reset($urls);
	}

	/**
	 * Show GET (wrapper around getGET)
	 */
	public function showGET() {
		$string = call_user_func_array(array($this, 'getGET'),
			func_get_args());

		$this->showHTMLValue($string);
	}

	/**
	 * Sanitize string for use between HTML tags/quotes
	 * e.g., <input value="HERE"> or <div>HERE</div>
	 * @param string $string String to sanitize
	 * @return string The sanitized string
	 */
	public function showHTMLValue($string) {
		echo htmlentities($string, ENT_QUOTES);
	}

	/**
	 * Sanitize string for use as a Javascript variable value
	 * e.g., var foo = HERE;
	 * @param string $string String to sanitize
	 * @return string The sanitized string
	 */
	public function showJSValue($string) {
		printf("decodeURIComponent('%s');\n", rawurlencode($string));
	}

	/**
	 * Show href (wrapper around buildSelfURN)
	 */
	public function showSelfURN($path = '') {
		echo call_user_func_array(array($this, 'buildSelfURN'),
			func_get_args());
	}

	/**
	 * Show javascript links
	 * @param array $urls
	 */
	public function showJSLinks($urls = array()) {
		if(empty($urls)) {
			return;
		}

		while(list($junk, $url) = each($urls)) {
			printf("<script type=\"text/javascript\" src=\"%s\">",
				$url);
			echo "</script>\n";
		}
		reset($urls);
	}

	/**
	 * Show a top-level yui-style tabs menu
	 * @param string $div
	 * @param array $tabs array(dir => title, ...)
	 * @param string $default which tab should be selected by default
	 */
	public function showTabs($div, $tabs, $default = '/') {
		$def_path = $this->buildSelfURN($default);
		$req_path = dirname($_SERVER['PHP_SELF']);

		$def_path = rtrim($def_path, '/');

		printf("<div id=\"%s\" class=\"yui-navset\">\n", $div);
		echo ' <ul class="yui-nav">' . "\n";

		while(list($rdir, $title) = each($tabs)) {
			$dir = ltrim($rdir, '/');
			$href = $this->buildSelfURN($dir);

			echo '  <li';
			if(rtrim($href, '/') == $req_path) {
				echo ' class="selected"';
			}
			echo '>';

			printf("<a href=\"%s\"><em>%s</em></a></li>\n",
				$href, $title);
		}
		reset($tabs);

		echo ' </ul>' . "\n";
		echo '</div>' . "\n";
	}
}

?>
